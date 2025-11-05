<?php

namespace App\Enums;

enum AdminStatusEnum: string
{
    case Pending = 'pending';
    case Active = 'active';
    case Suspended = 'suspended';
}