import os
import io
import base64
import json
import time
import subprocess
import threading # type: ignore
import shutil # type: ignore
from typing import List, Any, Dict, Union, Optional

from fastapi import FastAPI, UploadFile, File, Form, HTTPException
from fastapi.responses import JSONResponse, Response
from fastapi.middleware.cors import CORSMiddleware
import uvicorn
from PIL import Image
from dotenv import load_dotenv
import ollama
import spaces # type: ignore
import gradio as gr
import google.generativeai as genai

load_dotenv()

ALLOWED_ORIGINS_RAW: Optional[str] = os.getenv("ALLOWED_ORIGINS")
MODEL_NAME: Optional[str] = os.getenv("MODEL_NAME")
GEMINI_API_KEY: Optional[str] = os.getenv("GEMINI_API_KEY")
GEMINI_MODELS_RAW: Optional[str] = os.getenv("GEMINI_MODELS")

SERVICE_MAP_STR = os.getenv("SERVICE_CODES_MAP", "{}")
SERVICE_MAP = json.loads(SERVICE_MAP_STR)

GEMINI_SYSTEM_INSTRUCTION = os.getenv("GEMINI_SYSTEM_INSTRUCTION", "{}")

ALLOWED_ORIGINS = ["*"] if ALLOWED_ORIGINS_RAW == "*" else [origin.strip() for origin in ALLOWED_ORIGINS_RAW.split(",")] # type: ignore
GEMINI_MODEL_LIST: List[str] = [model.strip() for model in GEMINI_MODELS_RAW.split(',')] if GEMINI_MODELS_RAW else []

print(f"ALLOWED_ORIGINS: {ALLOWED_ORIGINS}")
print(f"LOCAL_MODEL_NAME: {MODEL_NAME}")
print(f"GEMINI_MODELS: {GEMINI_MODEL_LIST}")

# def setup_ollama():
#     print("Checking Ollama setup...")
#     if not shutil.which("ollama"):
#         print("Ollama not found. Installing...")
#         subprocess.run("curl -fsSL https://ollama.com/install.sh | sh", shell=True, check=True)
    
#     def run_server():
#         print("Starting Ollama Serve...")
#         subprocess.Popen(["ollama", "serve"])
    
#     t = threading.Thread(target=run_server, daemon=True)
#     t.start()
    
#     print("Waiting for Ollama to spin up...")
#     time.sleep(5)
    
#     print(f"Pulling Model: {MODEL_NAME}...")
#     try:
#         subprocess.run(["ollama", "pull", MODEL_NAME], check=True) # type: ignore
#         print("Model pulled successfully.")
#     except Exception as e:
#         print(f"Error pulling model: {e}")

# setup_ollama()

if GEMINI_API_KEY:
    try:
        genai.configure(api_key=GEMINI_API_KEY) # type: ignore
        print("Gemini client configured successfully.")
    except Exception as e:
        raise EnvironmentError(f"Error configuring Gemini: {e}")
else:
    raise EnvironmentError("Warning: GEMINI_API_KEY not found. The /api/analyze/gemini endpoint and fallback will be unavailable.")

app = FastAPI()

app.add_middleware(
    CORSMiddleware,
    allow_origins=ALLOWED_ORIGINS,
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

def process_image_to_base64(image_bytes: bytes) -> Union[str, None]:
    """Converts image bytes to a base64 encoded string."""
    try:
        img = Image.open(io.BytesIO(image_bytes)).convert('RGB')
        buffered = io.BytesIO()
        img.save(buffered, format="JPEG")
        return base64.b64encode(buffered.getvalue()).decode('utf-8')
    except Exception as e:
        print(f"Error processing image: {e}")
        return None

async def process_uploaded_files(images: List[UploadFile]) -> Dict[str, List[Any]]:
    """Reads uploaded files and converts them to bytes and base64 strings."""
    if not images:
        raise HTTPException(status_code=400, detail="Wajib melampirkan minimal 1 foto bukti.")

    image_bytes_list: List[bytes] = []
    base64_images: List[str] = []
    
    for img_file in images:
        content = await img_file.read()
        if len(content) > 0:
            image_bytes_list.append(content)
            b64 = process_image_to_base64(content)
            if b64:
                base64_images.append(b64)

    if not base64_images:
        raise HTTPException(status_code=400, detail="File gambar tidak valid atau corrupt.")

    return {"bytes": image_bytes_list, "b64": base64_images}

def validate_ai_output(ai_content: Dict[str, Any]) -> Dict[str, Any]:
    """Validates the JSON output from an AI model against the required structure and values."""
    required_keys = ["title", "category", "priority", "service_code"]
    missing_keys = [key for key in required_keys if key not in ai_content]
    if missing_keys:
        raise ValueError(f"Missing keys in AI JSON response: {', '.join(missing_keys)}")

    if not str(ai_content.get("title", "")).strip():
        raise ValueError("AI returned an empty title")

    service_code = ai_content["service_code"]
    if service_code not in SERVICE_MAP:
        raise ValueError(f"Invalid service_code '{service_code}'. Not found in service map.")

    expected_category = SERVICE_MAP[service_code]
    if ai_content["category"] != expected_category:
        raise ValueError(f"Category mismatch for code {service_code}. Got '{ai_content['category']}', expected '{expected_category}'")

    priority = str(ai_content["priority"]).lower()
    if priority not in ['high', 'medium', 'low']:
        raise ValueError(f"Invalid priority value: '{priority}'")
    
    ai_content["priority"] = priority
    return ai_content

@spaces.GPU(duration=60)
def run_local_inference(report_text: str, base64_images: List[str]) -> Dict[str, Any]:
    """Runs inference using the local Ollama model."""
    print("Starting Local GPU Inference...")
    try:
        ollama.show(MODEL_NAME) # type: ignore
    except Exception:
        print("Model not found in GPU context, pulling again...")
        subprocess.run(["ollama", "pull", MODEL_NAME], check=True) # type: ignore

    response = ollama.chat( # type: ignore
        model=MODEL_NAME, # type: ignore
        messages=[{
            'role': 'user',
            'content': report_text,
            'images': base64_images,
        }],
        format='json',
        options={'temperature': 0.1}
    )
    return response # type: ignore

def run_gemini_inference(report_text: str, image_bytes_list: List[bytes], model_name: str) -> Dict[str, Any]:
    """Runs inference using the Google Gemini model."""
    print(f"Starting Gemini Inference with model: {model_name}...")
    if not GEMINI_API_KEY:
        raise ConnectionError("GEMINI_API_KEY is not configured.")

    model = genai.GenerativeModel(model_name, system_instruction=GEMINI_SYSTEM_INSTRUCTION) # type: ignore
    pil_images = [Image.open(io.BytesIO(content)) for content in image_bytes_list]
    
    response = model.generate_content([report_text, *pil_images], generation_config={"response_mime_type": "application/json"}) # type: ignore
    
    ai_content = json.loads(response.text)
    return ai_content

@app.get("/")
def health_check():
    return Response("Python Backend is running.")

@app.post("/api/analyze/local")
async def analyze_local(report: str = Form(...), images: List[UploadFile] = File(...)): # type: ignore
    """Endpoint to analyze a report using only the local Ollama model."""
    if not report or len(report) < 10:
        raise HTTPException(status_code=400, detail="Deskripsi laporan wajib diisi minimal 10 karakter.")
    
    processed_images = await process_uploaded_files(images)
    base64_images = processed_images["b64"]
    
    try:
        response_raw = run_local_inference(report, base64_images)
        if 'message' not in response_raw or 'content' not in response_raw['message']:
            raise ValueError("Empty or invalid response structure from local AI")

        ai_content = validate_ai_output(json.loads(response_raw['message']['content']))

        return { # type: ignore
            "status": "success",
            "data": ai_content,
            "meta": {
                "model": MODEL_NAME,
                'processing_time_sec': (response_raw.get("total_duration", 0)) / 1e9,
                "images_analyzed": len(base64_images),
            }
        }
    except Exception as e:
        print(f"Local analysis failed: {str(e)}")
        raise HTTPException(status_code=500, detail=f"Local AI Failed: {str(e)}")

@app.post("/api/analyze/gemini")
async def analyze_gemini(report: str = Form(...), images: List[UploadFile] = File(...)): # type: ignore
    """Endpoint to analyze a report using only the Gemini model."""
    if not report or len(report) < 10:
        raise HTTPException(status_code=400, detail="Deskripsi laporan wajib diisi minimal 10 karakter.")
        
    processed_images = await process_uploaded_files(images)
    image_bytes_list = processed_images["bytes"]

    if not GEMINI_MODEL_LIST:
        raise HTTPException(status_code=501, detail="No Gemini models configured in the environment.")

    primary_gemini_model = GEMINI_MODEL_LIST[0]
    
    try:
        start_time = time.time()
        ai_content = validate_ai_output(run_gemini_inference(report, image_bytes_list, primary_gemini_model))
        end_time = time.time()

        return { # type: ignore
            "status": "success",
            "data": ai_content,
            "meta": {
                "model": primary_gemini_model,
                'processing_time_sec': end_time - start_time,
                "images_analyzed": len(image_bytes_list),
            }
        }
    except Exception as e:
        print(f"Gemini analysis failed: {str(e)}")
        raise HTTPException(status_code=500, detail=f"Gemini AI Failed: {str(e)}")

@app.post("/api/analyze")
async def analyze_with_fallback(report: str = Form(...), images: List[UploadFile] = File(...)): # type: ignore
    """
    Main analysis endpoint. Tries the local model up to 3 times.
    If it fails, it falls back to the Gemini model.
    """
    if not report or len(report) < 10:
        raise HTTPException(status_code=400, detail="Deskripsi laporan wajib diisi minimal 10 karakter.")
        
    processed_images = await process_uploaded_files(images)
    base64_images = processed_images["b64"] # type: ignore
    image_bytes_list = processed_images["bytes"]
    
    last_local_exception = None
    last_gemini_exception = None
    
    # max_local_retries = 3 # type: ignore
    # for attempt in range(max_local_retries):
    #     try:
    #         print(f"Attempting Local AI Analysis... ({attempt + 1}/{max_local_retries})")
    #         response_raw = run_local_inference(report, base64_images)

    #         if 'message' not in response_raw or 'content' not in response_raw['message']:
    #             raise ValueError("Empty response structure from local AI")

    #         ai_content = validate_ai_output(json.loads(response_raw['message']['content']))
            
    #         response = { # type: ignore
    #             "status": "success",
    #             "data": ai_content,
    #             "meta": {
    #                 "model": MODEL_NAME,
    #                 'processing_time_sec': (response_raw.get("total_duration", 0)) / 1e9,
    #                 "images_analyzed": len(base64_images),
    #                 "source": "local",
    #                 "attempts": attempt + 1
    #             }
    #         }
            
    #         print("Local AI Success")
    #         print(json.dumps(response, indent=2, ensure_ascii=True))
            
    #         return response # type: ignore
    #     except Exception as e:
    #         print(f"Local AI Attempt {attempt + 1} failed: {str(e)}")
    #         last_local_exception = e
    #         time.sleep(1)

    # print(f"Local model failed. Falling back to Gemini models.")
    
    if not GEMINI_MODEL_LIST:
        return JSONResponse(
            status_code=500,
            content={
                "status": "error",
                "message": "Local AI failed and no Gemini models are configured for fallback.",
                "local_model_error": str(last_local_exception),
            }
        )
        
    print(GEMINI_MODEL_LIST)
        
    for model_name in [model_name for model_name in GEMINI_MODEL_LIST for _ in range(3)]:
        try:
            start_time = time.time()
            ai_content = validate_ai_output(run_gemini_inference(report, image_bytes_list, model_name))
            end_time = time.time()
            
            response = { # type: ignore
                "status": "success",
                "data": ai_content,
                "meta": {
                    "model": model_name,
                    'processing_time_sec': end_time - start_time,
                    "images_analyzed": len(image_bytes_list),
                    "source": "gemini_fallback"
                }
            }
            
            print(f"Gemini AI Fallback Success with model {model_name}")
            print(json.dumps(response, indent=2, ensure_ascii=True))
            
            return response # type: ignore
        except Exception as e:
            print(f"Gemini AI Fallback with model {model_name} failed: {str(e)}")
            last_gemini_exception = e
            continue
    
    return JSONResponse(
        status_code=500,
        content={
            "status": "error", 
            "message": "All AI models (Local and Gemini fallbacks) failed to process the request.",
            "local_model_error": str(last_local_exception),
            "last_gemini_model_error": str(last_gemini_exception)
        }
    )

if __name__ == "__main__":
    with gr.Blocks() as demo:
        gr.Markdown("# LAPOR AI API Backend")
        gr.Markdown(
            "This space hosts the API endpoints for analyzing citizen reports. "
            "The primary endpoint is `/api/analyze` which uses a local model with a Gemini fallback."
        )
        gr.Markdown(f"**Local Model:** `{MODEL_NAME}`")
        gr.Markdown(f"**Fallback Models (in order):** `{', '.join(GEMINI_MODEL_LIST)}`")
    
    app = gr.mount_gradio_app(app, demo, path="/") # type: ignore
    
    uvicorn.run(app, host="0.0.0.0", port=7860)