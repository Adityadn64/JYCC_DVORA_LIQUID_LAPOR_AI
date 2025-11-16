#!/usr/bin/env python3
"""
AES-256 Key Generator for Laravel Lapor.ai Project
Generates secure 32-character keys for AES-256 encryption

Usage:
    python aes_key_generator.py
    python aes_key_generator.py --count 4
    python aes_key_generator.py --env-format
"""

import os
import secrets
import string
import argparse
from typing import List


class AESKeyGenerator:
    """AES-256 Key Generator for Laravel Lapor.ai Project"""

    def __init__(self):
        # AES-256 requires exactly 32 characters (256 bits)
        self.key_length = 32
        # Use only alphanumeric characters and some special chars for compatibility
        self.charset = string.ascii_letters + string.digits + "!@#$%^&*"

    def generate_single_key(self) -> str:
        """Generate a single AES-256 key"""
        return ''.join(secrets.choice(self.charset) for _ in range(self.key_length))

    def generate_keys(self, count: int = 4) -> List[str]:
        """Generate multiple AES-256 keys"""
        return [self.generate_single_key() for _ in range(count)]

    def validate_key(self, key: str) -> bool:
        """Validate if a key is exactly 32 characters"""
        return len(key) == self.key_length

    def generate_env_format(self, keys: List[str]) -> str:
        """Generate environment variable format for .env files"""
        env_template = """# AES-256 Encryption Keys for Laravel Lapor.ai
# Generated securely using cryptographically secure random generator

# Laravel Environment Variables
K3="{keys[2]}"  # Laravel->Express (encrypt)
K2="{keys[1]}"  # Express->Laravel (decrypt)

# Express Environment Variables
K1="{keys[0]}"  # React->Express (decrypt)
K2="{keys[1]}"  # Express->Laravel (encrypt)
K3="{keys[2]}"  # Laravel->Express (decrypt)
K4="{keys[3]}"  # Express->React (encrypt)

# React Environment Variables
K1="{keys[0]}"  # React->Express (encrypt)
K4="{keys[3]}"  # Express->React (decrypt)

# Key Mapping:
# K1: React->Express (encrypt/decrypt)
# K2: Express->Laravel (encrypt/decrypt)
# K3: Laravel->Express (encrypt/decrypt)
# K4: Express->React (encrypt/decrypt)
"""

        return env_template.format(keys=keys)

    def generate_readme_format(self, keys: List[str]) -> str:
        """Generate README format with key explanations"""
        readme_template = """# AES-256 Encryption Keys Configuration

## Generated Keys

**Laravel (.env):**
```
K3="{keys[2]}"  # Laravel->Express (encrypt)
K2="{keys[1]}"  # Express->Laravel (decrypt)
```

**Express (.env):**
```
K1="{keys[0]}"  # React->Express (decrypt)
K2="{keys[1]}"  # Express->Laravel (encrypt)
K3="{keys[2]}"  # Laravel->Express (decrypt)
K4="{keys[3]}"  # Express->React (encrypt)
```

**React (.env):**
```
K1="{keys[0]}"  # React->Express (encrypt)
K4="{keys[3]}"  # Express->React (decrypt)
```

## Key Architecture

```
React → Express → Laravel
  ↓       ↓       ↓
K1       K2      K3
K4       K4      K3
```

### Key Usage:
- **K1**: React → Express (encrypt/decrypt)
- **K2**: Express → Laravel (encrypt/decrypt)
- **K3**: Laravel → Express (encrypt/decrypt)
- **K4**: Express → React (encrypt/decrypt)

### Security Notes:
- Each key is exactly 32 characters (256 bits) for AES-256
- Keys are generated using cryptographically secure random generator
- Never commit these keys to version control
- Rotate keys periodically for enhanced security
"""

        return readme_template.format(keys=keys)


def main():
    """Main function to run the key generator"""
    parser = argparse.ArgumentParser(
        description='AES-256 Key Generator for Laravel Lapor.ai Project',
        formatter_class=argparse.RawDescriptionHelpFormatter,
        epilog="""
Examples:
  python aes_key_generator.py                    # Generate 4 keys
  python aes_key_generator.py --count 4         # Generate 4 keys
  python aes_key_generator.py --env-format      # Generate .env format
  python aes_key_generator.py --readme          # Generate README format
  python aes_key_generator.py --all             # Generate all formats
        """
    )

    parser.add_argument(
        '--count',
        type=int,
        default=4,
        help='Number of keys to generate (default: 4)'
    )

    parser.add_argument(
        '--env-format',
        action='store_true',
        help='Output in .env file format'
    )

    parser.add_argument(
        '--readme',
        action='store_true',
        help='Output in README format'
    )

    parser.add_argument(
        '--all',
        action='store_true',
        help='Output all formats'
    )

    parser.add_argument(
        '--validate',
        type=str,
        help='Validate a specific key'
    )

    args = parser.parse_args()

    generator = AESKeyGenerator()

    # Validate single key if requested
    if args.validate:
        is_valid = generator.validate_key(args.validate)
        print(f"Key validation: {'✓ Valid' if is_valid else '✗ Invalid'}")
        print(f"Length: {len(args.validate)}/32 characters")
        return

    # Generate keys
    keys = generator.generate_keys(args.count)

    print("🔐 AES-256 Key Generator for Laravel Lapor.ai")
    print("=" * 50)

    # Output formats
    if args.env_format or args.all:
        print("\n📄 .env Format:")
        print("-" * 20)
        print(generator.generate_env_format(keys))

    if args.readme or args.all:
        print("\n📖 README Format:")
        print("-" * 20)
        print(generator.generate_readme_format(keys))

    # Default output (just keys)
    if not args.env_format and not args.readme and not args.all:
        print("\n🔑 Generated AES-256 Keys:")
        print("-" * 30)
        for i, key in enumerate(keys, 1):
            print(f"Key {i}: {key}")
            print(f"       Length: {len(key)}/32 ✓")
        print("\n⚠️  Important: Save these keys securely and never commit to version control!")


if __name__ == "__main__":
    main()
