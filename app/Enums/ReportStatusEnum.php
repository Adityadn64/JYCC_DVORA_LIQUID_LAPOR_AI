<?php

namespace App\Enums;

enum ReportStatusEnum: string
{
    case Pending = 'pending';
    case Process = 'process';
    case Rejected = 'rejected';
    case Finished = 'finished';
}