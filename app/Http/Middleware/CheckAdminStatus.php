<?php

namespace App\Http\Middleware;

use App\Traits\Middleware\CheckTheAdminTrait;
use Illuminate\Http\Request;
use Closure;

class CheckAdminStatus
{
    use CheckTheAdminTrait;

    public function handle(Request $request, Closure $next)
    {
        return $this->checkAdmin($request, false, $next);
    }
}