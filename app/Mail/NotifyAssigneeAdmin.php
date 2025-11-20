<?php

namespace App\Mail;

use Illuminate\Bus\Queueable;
use Illuminate\Mail\Mailable;
use Illuminate\Queue\SerializesModels;
use App\Models\Report;

class NotifyAssigneeAdmin extends Mailable
{
    use Queueable, SerializesModels;

    public $report;

    public function __construct(Report $report)
    {
        $this->report = $report;
    }

    public function build()
    {
        return $this->subject('Tugas Baru: #' . $this->report->id . ' - ' . $this->report->title)
                    ->view('emails.notify-assignee-admin');
    }
}