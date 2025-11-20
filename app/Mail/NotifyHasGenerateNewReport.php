<?php

namespace App\Mail;

use Illuminate\Bus\Queueable;
use Illuminate\Mail\Mailable;
use Illuminate\Queue\SerializesModels;
use App\Models\Report;

class NotifyHasGenerateNewReport  extends Mailable
{
    use Queueable, SerializesModels;

    public $report;

    public function __construct(Report $report)
    {
        $this->report = $report;
    }

    public function build()
    {
        return $this->subject('Laporan Diterima: #' . $this->report->id . ' - Lapor.ai')
                    ->view('emails.notify-new-report');
    }
}