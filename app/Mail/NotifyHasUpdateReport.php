<?php

namespace App\Mail;

use Illuminate\Bus\Queueable;
use Illuminate\Mail\Mailable;
use Illuminate\Queue\SerializesModels;
use App\Models\Report;

class NotifyHasUpdateReport  extends Mailable
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
        return $this->subject('Laporan Diterima: #' . $this->report->id . ' - Lapor.ai')
                    ->view('emails.notify-update-report');
    }
}