import { UI_POSITIONS, INFO_MSGS } from '../constants/index.js';
import { Ui } from './ui.js';
import { ResultsService } from 'src/services/results.service.js';

export class StatsUi extends Ui {
  constructor(private resultsService: ResultsService) {
    super();
  }

  render(): void {
    const { totalSpace, spaceReleased } = this.resultsService.getStats();

    const totalSpacePosition = { ...UI_POSITIONS.TOTAL_SPACE };
    const spaceReleasedPosition = { ...UI_POSITIONS.SPACE_RELEASED };

    totalSpacePosition.x += INFO_MSGS.TOTAL_SPACE.length;
    spaceReleasedPosition.x += INFO_MSGS.SPACE_RELEASED.length;

    this.printAt(totalSpace, totalSpacePosition);
    this.printAt(spaceReleased, spaceReleasedPosition);
  }
}
