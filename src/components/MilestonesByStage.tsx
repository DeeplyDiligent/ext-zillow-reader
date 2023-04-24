import 'bootstrap/dist/css/bootstrap.min.css';
import '../App.css';
import { Container, ListGroup, Row } from 'react-bootstrap';
import { useSelector } from 'react-redux'
import { RootState } from '../store';
import { filterData } from '../state/opportunityFilter';
import { Milestone, Opportunity } from './Dynamics';
import { MilestoneView } from './MilestoneView';
import moment from 'moment'

export function MilestonesByStage() {

  return (<Row><MilestoneStage /></Row>)
}

interface MilestoneWithOpportunity {
  milestone: Milestone,
  opportunity: Opportunity,
  dueOn: moment.Moment
}

export default function MilestoneStage() {

  const raw = useSelector((state: RootState) => state.msx.rawData)
  const filter = useSelector((state: RootState) => state.filter)
  const msx = filterData(raw, filter)
  const now = moment()

  const milestonesWithOps = msx.Opportunities.reduce(
    (prev, next) => prev.concat(next.milestones.map(x => ({
      opportunity: next,
      milestone: x,
      dueOn: moment(x.msp_milestonedate, 'YYYY-MM-DD')
    } as MilestoneWithOpportunity))), [] as Array<MilestoneWithOpportunity>
  )

  function onlyUnique(value: string, index: number, array: string[]) {
    return array.indexOf(value) === index;
  }

  const distinctDueOns = milestonesWithOps.sort((a, b) => moment(a.dueOn) < moment(b.dueOn) ? -1 : 1).map(x => x.dueOn.from(now)).filter(onlyUnique)
  const milestonesGroupedByDueOn = distinctDueOns.map(dueOn => ({
    dueOn,
    milestones: milestonesWithOps.filter(x => x.dueOn.from(now) === dueOn)
  }))

  return (
    <Container className='mainTable'>
      {milestonesGroupedByDueOn
        .map(item =>
          <>
            <h2>Due {item.dueOn}</h2>
            {
              itemsToGrid(item.milestones, 4).map(itemGroup => <Row>
                <ListGroup horizontal>
                  {
                    itemGroup.map(m => (
                      <ListGroup.Item>
                        <MilestoneView key={m.milestone.msp_engagementmilestoneid}
                          opportunity={m.opportunity}
                          milestone={m.milestone} />
                      </ListGroup.Item>
                    ))
                  }
                </ListGroup>
              </Row>
              )
            }
          </>)}
    </Container>
  )
}

function itemsToGrid<T>(items: T[], columns: number): T[][] {
  return Array.from({ length: 10 })
    .map((_, row) => items.filter((item, itemIndex) => itemIndex >= (row * columns) && itemIndex < ((row + 1) * columns)))
}