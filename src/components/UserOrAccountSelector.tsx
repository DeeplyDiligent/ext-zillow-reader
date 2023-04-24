import React, { useState } from 'react';
import 'bootstrap/dist/css/bootstrap.min.css';
import Form from 'react-bootstrap/Form';
import { Col, Row, Button } from 'react-bootstrap';
import { useDispatch } from 'react-redux'
import { fetchData } from '../state/msxSlice'
import type { AppDispatch } from '../store'

export default function UserOrAccountSelector() {

    const [state, setState] = useState({
        entities: '1441819',
    })

    const dispatch = useDispatch<AppDispatch>()
    
    return <Form>
        <Form.Group controlId="formSearch" as={Row} className="mb-3" >
            <Form.Label column xs='auto'>TPIDs / Owners / Territories / etc</Form.Label>
            <Col sm={2}>
                <Form.Control type='text'
                    value={state.entities}
                    placeholder='Users / TPIDs / etc'
                    onChange={e => setState({
                        ...state,
                        entities: e.target.value
                    })} />
            </Col>
            <Col>
                <Button variant="primary" type="button" onClick={() => {
                    dispatch(
                        fetchData({
                            entities: state.entities,
                            force: false
                        }))
                }}>Fetch</Button>&nbsp;
                <Button variant="primary" type="button" onClick={() => {
                    dispatch(
                        fetchData({
                            entities: state.entities,
                            force: true
                        }))
                }}>Fetch with refresh</Button>
            </Col>
        </Form.Group>
    </Form>
}