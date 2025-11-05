<?php

namespace App\Enums;

enum RoleAdministratorEnum: string
{
    case SystemAdmin = 'system_admin';
    case BaseAdmin = 'base_admin';
}