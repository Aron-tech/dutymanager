<?php

namespace App\Http\Controllers;

use App\Models\Guild;
use App\Models\LicenseKey;
use Illuminate\Http\RedirectResponse;
use Illuminate\Http\Request;

class LicenseKeyController extends Controller
{
    public function activate(Request $request, Guild $guild): RedirectResponse
    {
        $request->validate([
            'license_key' => ['required', 'string'],
        ], [
            'license_key.required' => 'A license kulcs megadása kötelező.',
        ]);

        $key = $request->input('license_key');
        $license = LicenseKey::where('key', $key)->first();

        if (! $license) {
            return back()->withErrors(['license_key' => 'Érvénytelen license kulcs!']);
        }

        if ($license->used_at !== null) {
            return back()->withErrors(['license_key' => 'Ezt a license kulcsot már felhasználták!']);
        }

        $active_license = LicenseKey::where('guild_id', $guild->id)
            ->get()
            ->filter(fn ($lic) => $lic->is_active)
            ->first();

        if ($active_license && $active_license->plan_type === 'lifetime') {
            return back()->withErrors(['license_key' => 'Ennek a szervernek már van egy örökös (lifetime) aktivációja!']);
        }

        $license->update([
            'used_at' => now(),
            'activated_by' => auth()->id(),
            'guild_id' => $guild->id,
        ]);

        return back()->with('success', 'Prémium license sikeresen aktiválva!');
    }
}
