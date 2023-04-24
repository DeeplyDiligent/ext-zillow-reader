import { AreaChart, Area, XAxis, YAxis, CartesianGrid, Tooltip } from 'recharts';
import moment, { Moment } from 'moment'
import { useSelector } from 'react-redux'
import type { RootState } from '../store'
import { filterData, sortMilestones } from '../state/opportunityFilter';
import { Fragment } from 'react';
import { Card, Table } from 'react-bootstrap';


interface AcrMonth {
    dueOn: Date
    doneAcr: number
    onTrackAcr: number
    atRiskAcr: number
    cancelledAcr: number
    blockedAcr: number
    milestoneName: string
    isNonRecurring: boolean
}

interface AcrChartMonth {
    dueOn: Date
    dueOnNum: number
    doneAcr: number
    onTrackAcr: number
    atRiskAcr: number
    cancelledAcr: number
    blockedAcr: number
    carryForwardDoneAcr: number
    carryForwardOnTrackAcr: number
    carryForwardCancelledAcr: number
    carryForwardBlockedAcr: number
    carryForwardAtRiskAcr: number
    milestoneName: string
    firstMoment: Moment
}

export default function AcrView() {

    const raw = useSelector((state: RootState) => state.msx.rawData)
    const filter = useSelector((state: RootState) => state.filter)
    const msx = filterData(raw, filter)

    if (msx.Milestones.length === 0) return <Fragment />

    //build up a series based on the ACR from the milestones from earliest to latest milestone. Mark completed green, but unfinished orange.
    const data = sortMilestones([...msx.Milestones]).map<AcrMonth>(x => {
        const status = x["msp_milestonestatus@OData.Community.Display.V1.FormattedValue"]
        const isNonRecurring = x.msp_nonrecurring !== null
        return {
            dueOn: new Date(x.msp_milestonedate),
            doneAcr: status === 'Completed' ? x.msp_monthlyuse : 0,
            onTrackAcr: status === 'On Track' ? x.msp_monthlyuse : 0,
            cancelledAcr: status === 'Cancelled' ? x.msp_monthlyuse : 0,
            blockedAcr: status === 'Blocked' ? x.msp_monthlyuse : 0,
            atRiskAcr: status === 'At Risk' ? x.msp_monthlyuse : 0,
            milestoneName: x.msp_name,
            isNonRecurring: isNonRecurring
        }
    })
        .reduce((prev, current) => {
            if (prev.length === 0) {
                prev.push({
                    dueOn: current.dueOn,
                    dueOnNum: current.dueOn.getTime(),
                    doneAcr: current.doneAcr,
                    atRiskAcr: current.atRiskAcr,
                    onTrackAcr: current.onTrackAcr,
                    cancelledAcr: current.cancelledAcr,
                    blockedAcr: current.blockedAcr,
                    carryForwardDoneAcr: current.isNonRecurring ? 0 : current.doneAcr,
                    carryForwardAtRiskAcr: current.isNonRecurring ? 0 : current.atRiskAcr,
                    carryForwardOnTrackAcr: current.isNonRecurring ? 0 : current.onTrackAcr,
                    carryForwardCancelledAcr: current.isNonRecurring ? 0 : current.cancelledAcr,
                    carryForwardBlockedAcr: current.isNonRecurring ? 0 : current.blockedAcr,
                    milestoneName: current.milestoneName,
                    firstMoment: moment(current.dueOn)
                })
            } else {
                const last = prev[prev.length - 1]
                const realisedMonthsSinceFirstMoment = moment(current.dueOn).diff(last.firstMoment, 'M')
                prev.push({
                    dueOn: current.dueOn,
                    dueOnNum: current.dueOn.getTime(),
                    doneAcr: (last.carryForwardDoneAcr * realisedMonthsSinceFirstMoment) + current.doneAcr,
                    onTrackAcr: (last.carryForwardOnTrackAcr * realisedMonthsSinceFirstMoment) + current.onTrackAcr,
                    atRiskAcr: (last.carryForwardAtRiskAcr * realisedMonthsSinceFirstMoment) + current.atRiskAcr,
                    cancelledAcr: (last.carryForwardCancelledAcr * realisedMonthsSinceFirstMoment) + current.cancelledAcr,
                    blockedAcr: (last.carryForwardBlockedAcr * realisedMonthsSinceFirstMoment) + current.blockedAcr,
                    carryForwardDoneAcr: last.carryForwardDoneAcr + (current.isNonRecurring ? 0 : current.doneAcr),
                    carryForwardOnTrackAcr: last.carryForwardOnTrackAcr + (current.isNonRecurring ? 0 : current.onTrackAcr),
                    carryForwardCancelledAcr: last.carryForwardCancelledAcr + (current.isNonRecurring ? 0 : current.cancelledAcr),
                    carryForwardBlockedAcr: last.carryForwardBlockedAcr + (current.isNonRecurring ? 0 : current.blockedAcr),
                    carryForwardAtRiskAcr: last.carryForwardAtRiskAcr + (current.isNonRecurring ? 0 : current.atRiskAcr),
                    milestoneName: current.milestoneName,
                    firstMoment: last.firstMoment
                })
            }
            return prev
        }, new Array<AcrChartMonth>())

    return (
        <AreaChart width={1200} height={200} data={data} margin={{ top: 20, right: 20, bottom: 20, left: 20 }}>
            <CartesianGrid strokeDasharray="3 3" />
            <XAxis dataKey='dueOnNum' type="number" scale='time' domain={['auto', 'auto']} tickFormatter={(unixTimestamp) => moment(unixTimestamp).format("YYYY-MM-DD")} />
            <YAxis />
            <Tooltip content={({ active, payload, label }) => (payload === undefined ? <Fragment /> : <ChartToolTip msxMilestones={payload} />)} />
            <Area type="monotone" stackId="1" dataKey="doneAcr" fill="blue" />
            <Area type="monotone" stackId="1" dataKey="onTrackAcr" fill="green" />
            <Area type="monotone" stackId="1" dataKey="atRiskAcr" fill="yellow" />
            <Area type="monotone" stackId="1" dataKey="blockedAcr" fill="orange" />
            <Area type="monotone" stackId="1" dataKey="cancelledAcr" fill="red" />
        </AreaChart>
    )
}

interface ChartToolTipProps {
    msxMilestones: any[]
}

function ChartToolTip(props: ChartToolTipProps) {
    if (props.msxMilestones.length === 0) return <Fragment />

    const formatter = new Intl.NumberFormat('en-AU', {
        style: 'currency',
        currency: 'AUD',
    })

    const lastInGroup = props.msxMilestones[props.msxMilestones.length - 1].payload!

    return (<Card>
        <Card.Header><Card.Title>Cumulative ACR to {moment(lastInGroup.dueOn!).format("YYYY-MM-DD")}</Card.Title></Card.Header>
        <Card.Body>
            <Table>
                <tbody>
                    <tr>
                        <td>Done</td><td>{formatter.format(lastInGroup.doneAcr)}</td>
                    </tr>
                    <tr>
                        <td>In Progress</td><td>{formatter.format(lastInGroup.onTrackAcr)}</td>
                    </tr>
                    <tr>
                        <td>At Risk</td><td>{formatter.format(lastInGroup.atRiskAcr)}</td>
                    </tr>
                    <tr>
                        <td>Blocked</td><td>{formatter.format(lastInGroup.blockedAcr)}</td>
                    </tr>
                    <tr>
                        <td>Cancelled</td><td>{formatter.format(lastInGroup.cancelledAcr)}</td>
                    </tr>
                </tbody>
            </Table>
        </Card.Body>
    </Card>)
}
