<?php

namespace App\Mail;

use Illuminate\Bus\Queueable;
use Illuminate\Mail\Mailable;
use Illuminate\Queue\SerializesModels;

class NotifyPasswordReset extends Mailable
{
    use Queueable, SerializesModels;

    public $token;
    public $isEmail;

    public function __construct(string $token, bool $isEmail)
    {
        $this->token = $token;
        $this->isEmail = $isEmail;
    }

    public function build()
    {
        return $this->subject('Reset Password Akun Anda')
                    ->view('emails.password-reset');
    }
}