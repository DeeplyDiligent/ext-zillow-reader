import React, { useState } from 'react';
import 'bootstrap/dist/css/bootstrap.min.css';
import './App.css';
import { Container, Spinner, Alert, Row, ToggleButton, ButtonGroup, Navbar } from 'react-bootstrap';
import ErrorBoundary from './components/ErrorBoundary';
import { MilestonesByStage } from './components/MilestonesByStage';
import AcrView from './components/AcrView';
import { FilterView } from './components/FilterView';
import OpportunitiesByStage from './components/OpportunitiesByStage';
import UserOrAccountSelector from './components/UserOrAccountSelector';
import { useSelector } from 'react-redux'
import { RootState } from './store';

export default function App() {

  const [viewTypeState, setViewTypeState] = useState({
    viewType: 'opportunityview'
  })

  const msx = useSelector((state: RootState) => state.msx)

  const mainPiece = (msx.fetching) ? <h3>Fetching... Please wait <Spinner animation="border"></Spinner></h3> :
    msx.failedFetchMessage
      ? <Alert variant='danger'><h3>An error occurred fetching</h3><h4>{msx.failedFetchMessage}</h4></Alert>
      : msx.rawData.Opportunities.length === 0
        ? msx.hasSearched
          ? <h3>Sorry but no matching data was found. If fetching by user try using a full email address, not an alias.</h3>
          : <Container fluid>
            <h3>Welcome to MSX Viz!</h3>
            <div>
              <p>
                Enter some search terms such as email addresses, or TPIDs, or Sales Numbers to perform a search
              </p>
              <p>
                You can use commas to separate multiple search terms
              </p>
            </div>
          </Container>
        : (viewTypeState.viewType === 'opportunityview' ? <OpportunitiesByStage /> : <MilestonesByStage />)

  return (
    <>
      <Navbar bg="success" variant="dark">
        <Container fluid>
          <Navbar.Brand href="#home">MSX Viz</Navbar.Brand>
        </Container>
      </Navbar>
      <br />
      <Container fluid>
        <Row>
          <UserOrAccountSelector />
        </Row >
        <hr />
        <ErrorBoundary>
          <FilterView />
          <hr />
          <AcrView />
          <ButtonGroup>
            <ToggleButton key={'opportunityview'} id='opportunityview' type='radio' variant='outline-success' name='viewtype' value='opportunityview' checked={viewTypeState.viewType === 'opportunityview'}
              onChange={e => {
                setViewTypeState({
                  viewType: e.target.value,
                })
              }}
            >By Opportunity</ToggleButton>
            <ToggleButton key={'milestoneview'} id='milestoneview' type='radio' variant='outline-success' name='viewtype' value='milestoneview' checked={viewTypeState.viewType === 'milestoneview'}
              onChange={e => {
                setViewTypeState({
                  viewType: e.target.value,
                })
              }}
            >By Milestone</ToggleButton>
          </ButtonGroup>
          <hr />
          {mainPiece}
        </ErrorBoundary>
      </Container >
    </>
  )
}
