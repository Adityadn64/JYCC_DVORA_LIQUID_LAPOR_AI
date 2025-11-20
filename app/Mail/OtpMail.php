<?php

namespace App\Mail;

use Illuminate\Bus\Queueable;
use Illuminate\Mail\Mailable;
use Illuminate\Queue\SerializesModels;

class OtpMail extends Mailable
{
    use Queueable, SerializesModels;

    public $token;
    public $isEmail;

    public function __construct($token, $isEmail)
    {
        $this->token = $token;
        $this->isEmail = $isEmail;
    }

    public function build()
    {
        return $this->subject('Kode Verifikasi Registrasi Lapor.ai')
                    ->view('emails.create-account');
    }
}