<?php

namespace App\Http\Controllers\Api;

use App\Http\Controllers\Controller;
use App\Models\User;
use Illuminate\Http\JsonResponse;
use Illuminate\Http\Request;

class AdminUserController extends Controller
{
    public function index(Request $request): JsonResponse
    {
        $query = User::with('roles')->latest();

        if ($request->filled('search')) {
            $search = $request->search;
            $query->where(function ($q) use ($search) {
                $q->where('name', 'like', "%{$search}%")
                  ->orWhere('email', 'like', "%{$search}%")
                  ->orWhere('country', 'like', "%{$search}%")
                  ->orWhere('institution', 'like', "%{$search}%");
            });
        }

        if ($request->filled('role')) {
            $query->whereHas('roles', fn($q) => $q->where('name', $request->role));
        }

        $perPage = min((int) $request->get('per_page', 15), 100);
        $users   = $query->paginate($perPage);

        return response()->json(['data' => $users]);
    }

    public function show(int $id): JsonResponse
    {
        $user = User::with('roles')->findOrFail($id);
        return response()->json(['data' => $user]);
    }

    public function update(Request $request, int $id): JsonResponse
    {
        $user = User::findOrFail($id);

        $validated = $request->validate([
            'name'        => 'sometimes|string|max:255',
            'country'     => 'sometimes|string|max:100',
            'institution' => 'sometimes|string|max:255',
            'phone_number'=> 'sometimes|string|max:30',
            'role'        => 'sometimes|in:admin,assessor,student',
        ]);

        $user->update(collect($validated)->except('role')->toArray());

        if (isset($validated['role'])) {
            $user->syncRoles([$validated['role']]);
        }

        return response()->json([
            'message' => 'Data pengguna berhasil diperbarui.',
            'data'    => $user->load('roles'),
        ]);
    }
}
