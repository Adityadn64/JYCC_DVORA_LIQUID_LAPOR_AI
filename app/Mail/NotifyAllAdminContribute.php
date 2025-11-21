<?php

namespace App\Mail;

use Illuminate\Bus\Queueable;
use Illuminate\Mail\Mailable;
use Illuminate\Queue\SerializesModels;
use App\Models\Report;

class NotifyAllAdminContribute extends Mailable
{
    use Queueable, SerializesModels;

    public $report;
    public $is_https;

    public function __construct(Report $report, bool $is_https)
    {
        $this->report = $report;
        $this->is_https = $is_https;
    }

    public function build()
    {
        // Subjek yang lebih umum
        return $this->subject('Pembaruan Laporan: #' . $this->report->id . ' - ' . $this->report->title)
                    ->view('emails.notify-all-admin-contribute'); // Menggunakan view yang baru
    }
}