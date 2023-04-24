import { Milestone, Opportunity } from './Dynamics'
import moment from 'moment'
import Container from 'react-bootstrap/Row';
import Alert from 'react-bootstrap/Alert';
import Col from 'react-bootstrap/Col';
import Card from 'react-bootstrap/Card';
import { Badge } from 'react-bootstrap';
import { getMsxStage } from '../state/opportunityFilter';

export interface MilestoneProps {
    opportunity: Opportunity
    milestone: Milestone,
}

export function MilestoneView(props: MilestoneProps) {
    const status = props.milestone['msp_milestonestatus@OData.Community.Display.V1.FormattedValue' as keyof Milestone] as string
    const owner = props.milestone['_ownerid_value@OData.Community.Display.V1.FormattedValue' as keyof Milestone] as string
    const type = props.milestone['_msp_workloadlkid_value@OData.Community.Display.V1.FormattedValue']
    const date = moment(props.milestone.msp_milestonedate, 'YYYY-MM-DD')
    const daysAwayDisplay = date.fromNow()

    let alert = ''
    const daysAway = date.diff(moment(), 'days')
    const completedOrCancelled = status === 'Cancelled' || status === 'Completed'
    const commitment = props.milestone['msp_commitmentrecommendation@OData.Community.Display.V1.FormattedValue' as keyof Milestone] as string
    let msxStage = getMsxStage(props.opportunity)

    switch (true) {
        case status === 'Completed':
            alert='primary'
            break;
        case daysAway === 0 && !completedOrCancelled:
            alert = 'danger'
            break;
        case daysAway < 0 && status !== 'Cancelled':
            alert = 'danger'
            break;
        case status === 'Cancelled':
            alert='secondary'
            break;
        case commitment === 'Uncommitted' && msxStage.msxStage > 3:
            alert = 'warning'
            break;
        default:
            alert = 'success'
    }

    const updatedDate = moment(props.milestone.modifiedon)
    const updatedDaysAwayDisplay = updatedDate.fromNow()
    const updatedBy = props.milestone['_modifiedby_value@OData.Community.Display.V1.FormattedValue']

    let statusPill = 'success'
    switch (status) {
        case 'Blocked': statusPill = 'danger'; break;
        case 'Cancelled': statusPill = 'warning'; break;
        case 'At Risk': statusPill = 'warning'; break;
        default: statusPill = 'success';
    }

    let commitmentPill = commitment === 'Uncommitted' && msxStage.msxStage > 3 ? 'danger' : 'success'

    const monthlyUseFormatted = new Intl.NumberFormat('en-AU', { style: 'currency', currency: 'AUD' }).format(props.milestone.msp_monthlyuse)
    const acr = Math.abs(props.milestone.msp_monthlyuse) >= 25000 ? 
        <span><Badge pill text='dark' bg="warning">{monthlyUseFormatted}</Badge> {props.milestone.msp_nonrecurring === null ? 'Recurring' : 'Non Recurring'}</span> : 
        <span>{monthlyUseFormatted} {props.milestone.msp_nonrecurring === null ? 'Recurring' : 'Non Recurring'}</span>

    return (
        <Card style={{ minWidth: '500px'}} >
            <Alert key={alert} variant={alert}>
                <Container fluid>
                    <Col lg={4}>
                        <Card.Title>{acr}</Card.Title>
                        <Card.Subtitle>{props.milestone.msp_milestonedate.toString()}</Card.Subtitle>
                        <Card.Text><Badge pill bg={statusPill}>{status}</Badge></Card.Text>
                        <Card.Text><Badge pill bg={commitmentPill}>{commitment}</Badge></Card.Text>
                        {status !== "Cancelled" && status !== "Completed" ? <Card.Text>Due {daysAwayDisplay}</Card.Text> : <></>}
                    </Col>
                    <Col lg={8}>
                        <Card.Title>{props.milestone.msp_name}: {owner}</Card.Title>
                        <Card.Subtitle>{type}</Card.Subtitle>
                        <Card.Text>Updated {updatedDaysAwayDisplay} by {updatedBy}</Card.Text>
                        <Card.Link target='_blank' href={`https://microsoftsales.crm.dynamics.com/main.aspx?pagetype=entityrecord&etn=msp_engagementmilestone&id=${props.milestone.msp_engagementmilestoneid}`}>{props.milestone.msp_milestonenumber}</Card.Link>
                    </Col>
                </Container>
            </Alert>
        </Card >)
}