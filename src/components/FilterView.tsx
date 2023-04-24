import 'bootstrap/dist/css/bootstrap.min.css';
import '../App.css';
import Form from 'react-bootstrap/Form';
import { Col, Row } from 'react-bootstrap';
import moment from 'moment';
import type { RootState } from '../store'
import { useSelector, useDispatch } from 'react-redux'
import { setHideAnythingAfter, setHideAnythingBefore, setFreeText, setMilestoneFreeText, setStageToShow, setStageToHide, setHideOpportunitiesWithZeroVisibleMilestones, ProgressFilter, setProgressFilter, CommitmentFilter, setCommitmentFilter } from '../state/filterSlice'

export function FilterView() {
    const filter = useSelector((state: RootState) => state.filter)
    const dispatch = useDispatch()

    return (
        <Row>
            <Col >
                <Form>
                    <Row>
                        <Form.Label column lg={'auto'}>Opportunity Filter</Form.Label>
                        <Col lg={2}>
                            <Form.Control type='text'
                                name="search"
                                placeholder='Search'
                                value={filter.freeText}
                                onChange={e => dispatch(setFreeText(e.target.value))} />
                        </Col>
                        <Form.Label column lg={'auto'}>Milestone Filter</Form.Label>
                        <Col lg={2}>
                            <Form.Control type='text'
                                name="milestoneSearch"
                                placeholder='Search'
                                value={filter.milestoneFreeText}
                                onChange={e => dispatch(setMilestoneFreeText(e.target.value))} />
                        </Col>
                    </Row>
                    <br />
                    <Row>
                        <Form.Label column lg={2}>Hide Milestones before</Form.Label>
                        <Col lg={2}>
                            <Form.Control type='date'
                                name="hideBefore"
                                value={moment(filter.hideAnythingBefore).format('YYYY-MM-DD')}
                                onChange={e => dispatch(setHideAnythingBefore(moment(e.target.value)))} />
                        </Col>
                        <Form.Label column lg="auto">and after</Form.Label>
                        <Col lg={2}>
                            <Form.Control type='date'
                                name="hideBefore"
                                value={moment(filter.hideAnythingAfter).format('YYYY-MM-DD')}
                                onChange={e => dispatch(setHideAnythingAfter(moment(e.target.value)))} />
                        </Col>
                    </Row>
                    <br />
                    <Row>
                        <Col>
                            <Form.Check type='switch'
                                name="hideWhenZeroVisibleMilestones"
                                label="Hide Ops with 0 visible milestones"
                                checked={filter.hideOpportunitiesWithZeroVisibleMilestones}
                                onChange={e => dispatch(setHideOpportunitiesWithZeroVisibleMilestones(e.target.checked))} />
                        </Col>
                    </Row>
                    <Row>
                        {['1', '2', '3', '4', '5'].map(stage => (
                            <Col lg={2}><Form.Check
                                type='switch' inline
                                label={`Show Stage ${stage.toString()}`}
                                value={stage}
                                id={stage.toString()}
                                key={`stage-${stage.toString()}`}
                                checked={filter.stagesToShow.includes(stage)}
                                name='StagesGroup'
                                onChange={e => {
                                    let currentStages = filter.stagesToShow
                                    if (currentStages.includes(e.target.value)) {
                                        dispatch(setStageToHide(e.target.value))
                                    } else {
                                        dispatch(setStageToShow(e.target.value))
                                    }
                                }} /></Col>
                        ))}

                    </Row>
                    <Row>
                        {[ProgressFilter[ProgressFilter.OnTrack], ProgressFilter[ProgressFilter.Completed], ProgressFilter[ProgressFilter.Cancelled], ProgressFilter[ProgressFilter.Blocked], ProgressFilter[ProgressFilter.AtRisk]].map(x => (
                            <Col lg={2}><Form.Check
                                type='switch' inline
                                label={`Hide ${x.toString()}`}
                                value={x}
                                id={x}
                                key={`stage-${x.toString()}`}
                                checked={filter.progressFilter.includes(ProgressFilter[x as keyof typeof ProgressFilter])}
                                name='StagesGroup'
                                onChange={e => {
                                    let current = filter.progressFilter
                                    let selected = ProgressFilter[e.target.value as keyof typeof ProgressFilter]
                                    if (current.includes(selected)) {
                                        dispatch(setProgressFilter(current.filter(x => x !== selected)))
                                    } else {
                                        dispatch(setProgressFilter(current.concat(selected)))
                                    }
                                }} /></Col>
                        ))}


                    </Row>
                    <Row>

                        {[CommitmentFilter[CommitmentFilter.Uncommitted], CommitmentFilter[CommitmentFilter.Committed]].map(x => (
                            <Col lg={2}>
                                <Form.Check
                                    type='switch' inline
                                    label={`Hide ${x.toString()}`}
                                    value={x}
                                    id={x}
                                    key={`stage-${x.toString()}`}
                                    checked={filter.commitmentFilter.includes(CommitmentFilter[x as keyof typeof CommitmentFilter])}
                                    name='StagesGroup'
                                    onChange={e => {
                                        let current = filter.commitmentFilter
                                        let selected = CommitmentFilter[e.target.value as keyof typeof CommitmentFilter]
                                        if (current.includes(selected)) {
                                            dispatch(setCommitmentFilter(current.filter(x => x !== selected)))
                                        } else {
                                            dispatch(setCommitmentFilter(current.concat(selected)))
                                        }
                                    }} />
                            </Col>
                        ))}
                    </Row>
                </Form>
            </Col>
        </Row >
    )
}