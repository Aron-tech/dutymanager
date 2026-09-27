<?php

use App\Models\Guild;

test('saving data atomically keeps keys written by other model instances', function () {
    $guild = Guild::factory()->create(['data' => ['roles' => ['1' => 'Old']]]);

    // Two stale copies, like the async role sync and duty panel callbacks of the bot.
    $role_sync_copy = Guild::find($guild->id);
    $panel_copy = Guild::find($guild->id);

    $panel_copy->saveDataAtomically('last_duty_panel_message_id', '999');
    $role_sync_copy->saveDataAtomically('roles', ['1' => 'New']);

    expect($guild->fresh()->data)->toBe([
        'roles' => ['1' => 'New'],
        'last_duty_panel_message_id' => '999',
    ])->and($role_sync_copy->getData('last_duty_panel_message_id'))->toBe('999');
});
