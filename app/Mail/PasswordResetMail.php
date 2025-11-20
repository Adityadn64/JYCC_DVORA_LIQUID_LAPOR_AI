<?php

namespace App\Mail;

use Illuminate\Bus\Queueable;
use Illuminate\Contracts\Queue\ShouldQueue; // Opsional, untuk antrian email
use Illuminate\Mail\Mailable;
use Illuminate\Queue\SerializesModels;

class PasswordResetMail extends Mailable
{
    use Queueable, SerializesModels;

    public $token;

    public function __construct(string $token)
    {
        $this->token = $token;
    }

    public function build()
    {
        return $this->subject('Reset Password Akun Anda')
                    ->view('emails.password-reset');
    }
}