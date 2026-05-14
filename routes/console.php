<?php

Schedule::command('app:cancel-invalid-active-duties-command')->everySixHours();
Schedule::command('app:clean-up-command')->daily();
Schedule::command('app:handle-expired-holiday-command')->daily();
Schedule::command('app:handle-expired-punishment-command')->daily();

