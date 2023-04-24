import { Opportunity, getOpportunityComments, OpportunityComments } from './Dynamics'
import moment from 'moment'
import Container from 'react-bootstrap/Row';
import Row from 'react-bootstrap/Row';
import Col from 'react-bootstrap/Col';
import { useSelector } from 'react-redux'
import { Accordion, Badge, Table } from 'react-bootstrap';
import type { RootState } from '../store'
import { getMsxStage, stages, filterData } from '../state/opportunityFilter';
import { MilestoneView } from './MilestoneView';

interface OpProps {
    opportunity: Opportunity
    rawOpportunity: Opportunity
}

export default function OpportunitiesByStage() {

    const raw = useSelector((state: RootState) => state.msx.rawData)
    const filter = useSelector((state: RootState) => state.filter)
    const msx = filterData(raw, filter)

    const byStage = msx.Opportunities.reduce(
        (prev, next) => {
            const stage = getMsxStage(next)
            if (prev[stage.internalStage]) prev[stage.internalStage].push(next)
            else prev[stage.internalStage] = [next]
            return prev
        }, {} as Record<string, Opportunity[]>
    )

    const getRawOp = (op: Opportunity) => raw.Opportunities.find(x => x.opportunityid === op.opportunityid)!

    return (
        <Container className='mainTable'>
            <Row>
                {Object.keys(byStage).sort().map(stageName =>
                    <Col className='stage' key={stageName}>
                        <h1>{stages[stageName].name} (Stage {stages[stageName].msxStage})</h1>
                        <div className='opportunities'>
                            {byStage[stageName]
                                .sort((a, b) => moment(a.msp_estcompletiondate, 'YYYY-MM-DD') < moment(b.msp_estcompletiondate, 'YYYY-MM-DD') ? -1 : 1)
                                .map(o => <OpportunityView key={o.opportunityid} opportunity={o} rawOpportunity={getRawOp(o)} />)}
                        </div>
                    </Col>)}
            </Row>
        </Container>
    )
}

function OpportunityView(props: OpProps) {

    const comments = getOpportunityComments(props.opportunity)
    const salesPlay = props.opportunity['msp_salesplay@OData.Community.Display.V1.FormattedValue']
    const blockedMilestoneCount = props.opportunity.milestones.filter(x => x['msp_milestonestatus@OData.Community.Display.V1.FormattedValue'] === 'Blocked').length

    return (
        <Accordion defaultActiveKey={props.opportunity.opportunityid}>
            <Accordion.Item eventKey={props.opportunity.opportunityid}>
                <div className='opportunity'>
                    <Accordion.Header>
                        <Container fluid='true'>
                            <Col lg={4}>
                                <h5>
                                    <a target='_blank' rel="noreferrer" href={`https://microsoftsales.crm.dynamics.com/main.aspx?pagetype=entityrecord&etn=opportunity&id=${props.opportunity.opportunityid}`}>
                                        {props.opportunity.msp_opportunitynumber}
                                    </a>
                                </h5>
                                <h5>{moment(props.opportunity.msp_estcompletiondate ?? props.opportunity.estimatedclosedate).format("YYYY-MM-DD")}</h5>
                                <h5>{props.opportunity['_ownerid_value@OData.Community.Display.V1.FormattedValue'] as string}</h5>
                                <h5>{props.opportunity.milestones.length} / {props.rawOpportunity.milestones.length} milestones</h5>
                                { blockedMilestoneCount > 0 && <Badge pill bg="danger"><h6>{blockedMilestoneCount} blocked milestones</h6></Badge> }
                            </Col>
                            <Col>
                                <h4>{props.opportunity.name}</h4>
                                <h5>{salesPlay}</h5>
                                <p>
                                    {
                                        comments && (<Table striped>
                                            <tbody>
                                                {comments.filter((val, idx) => idx < 2).map((comment, idx) => <OpportunityComment key={`${props.opportunity.opportunityid}.${idx}`} comment={comment} />)}
                                            </tbody>
                                        </Table>)
                                    }
                                </p>
                            </Col>
                        </Container>
                    </Accordion.Header>
                    <Accordion.Body>
                        {
                            [...props.opportunity.milestones].sort((a, b) => a.msp_milestonedate < b.msp_milestonedate ? -1 : 1)
                                .map(m => <MilestoneView key={m.msp_milestonenumber} opportunity={props.opportunity} milestone={m} />)
                        }
                    </Accordion.Body>
                </div>
            </Accordion.Item >
        </Accordion >
    )
}

interface OpportunityCommentsPopup {
    comment: OpportunityComments
    key: string
}

function OpportunityComment(props: OpportunityCommentsPopup) {
    return (
        <tr>
            <td>{moment(props.comment.modifiedOn).fromNow()}</td>
            <td>{props.comment.comment.substring(0, 150)}</td>
                {/* <OverlayTrigger
                    trigger="focus"
                    overlay={<Tooltip show={true} id={props.key}>{props.comment.comment}</Tooltip>}>
                    <div></div>
                </OverlayTrigger> */}
        </tr>
    )
}
