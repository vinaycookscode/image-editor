import { bootstrapApplication } from '@angular/platform-browser';
import { appConfig } from './app/app.config';
import { App } from './app/app';

// Clarity Icons registration
import { ClarityIcons } from '@cds/core/icon/icon.service.js';
import { folderIcon } from '@cds/core/icon/shapes/folder.js';
import { undoIcon } from '@cds/core/icon/shapes/undo.js';
import { redoIcon } from '@cds/core/icon/shapes/redo.js';
import { refreshIcon } from '@cds/core/icon/shapes/refresh.js';
import { repeatIcon } from '@cds/core/icon/shapes/repeat.js';
import { resizeIcon } from '@cds/core/icon/shapes/resize.js';
import { gridViewIcon } from '@cds/core/icon/shapes/grid-view.js';
import { minusIcon } from '@cds/core/icon/shapes/minus.js';
import { plusIcon } from '@cds/core/icon/shapes/plus.js';
import { expandCardIcon } from '@cds/core/icon/shapes/expand-card.js';
import { addTextIcon } from '@cds/core/icon/shapes/add-text.js';
import { pencilIcon } from '@cds/core/icon/shapes/pencil.js';
import { circleIcon } from '@cds/core/icon/shapes/circle.js';
import { checkIcon } from '@cds/core/icon/shapes/check.js';
import { sunIcon } from '@cds/core/icon/shapes/sun.js';
import { moonIcon } from '@cds/core/icon/shapes/moon.js';

ClarityIcons.addIcons(
  folderIcon,
  undoIcon,
  redoIcon,
  refreshIcon,
  repeatIcon,
  resizeIcon,
  gridViewIcon,
  minusIcon,
  plusIcon,
  expandCardIcon,
  addTextIcon,
  pencilIcon,
  circleIcon,
  checkIcon,
  sunIcon,
  moonIcon
);

bootstrapApplication(App, appConfig)
  .catch((err) => console.error(err));
