<?php

namespace App\Http\Middleware;

use Closure;
use Illuminate\Http\Request;
use Symfony\Component\HttpFoundation\Response;

class LocalizationMiddleware
{
    /**
     * Handle an incoming request.
     *
     * @param  Closure(Request): (Response)  $next
     */
    public function handle(Request $request, Closure $next): Response
    {
        $locale = $request->header('Accept-Language');

        if ($locale && in_array($locale, ['en', 'id'])) {
            app()->setLocale($locale);
        } else {
            app()->setLocale('id'); // Default fallback
        }

        return $next($request);
    }
}
