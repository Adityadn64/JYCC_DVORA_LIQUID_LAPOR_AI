<?php

namespace App\Mail;

use App\Models\Administrator;
use Illuminate\Bus\Queueable;
use Illuminate\Mail\Mailable;
use Illuminate\Queue\SerializesModels;
use App\Models\Report;

class NotifyAdminIdHasChanged  extends Mailable
{
    use Queueable, SerializesModels;

    public $report;
    public $new_admin;
    public $last_admin;
    public $is_https;

    public function __construct(Report $report, Administrator $new_admin, Administrator $last_admin, bool $is_https)
    {
        $this->report = $report;
        $this->new_admin = $new_admin;
        $this->last_admin = $last_admin;
        $this->is_https = $is_https;
    }

    public function build()
    {
        return $this->subject('Laporan Diterima: #' . $this->report->id . ' - Lapor.ai')
                    ->view('emails.notify-admin-id-changed');
    }
}