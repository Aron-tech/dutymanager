<?php

Schedule::command('app:cancel-invalid-active-duties-command')->everySixHours();
Schedule::command('app:clean-up-command')->daily();

