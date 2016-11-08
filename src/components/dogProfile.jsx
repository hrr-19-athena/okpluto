'use strict';

//Parent component for profile page - pulls event info from database, and controls render for profile info and user's events display

import { searchEvents } from '../services/eventServices.js'
import { findUserByUsername } from '../services/userServices';
import NavLoggedIn from './nav-loggedIn.jsx';
import React, { PropTypes as T } from 'react';
import AuthService from '../utils/AuthService.jsx';
import DogProfileDisplay from './dogProfileDisplay.jsx';
import EventList from './eventList.jsx'
import MuiThemeProvider from 'material-ui/styles/MuiThemeProvider';
import getMuiTheme from 'material-ui/styles/getMuiTheme';
import MyTheme from '../theme/theme.js';
import {Tabs, Tab} from 'material-ui/Tabs'
import Banner from './banner.jsx';
import FooterLoggedIn from './footer-loggedIn.jsx';

class DogProfile extends React.Component {
  constructor(props) {
    super(props);
    //Events load into state after they are pulled from the database. If there are no events in a particular category, "No events to show" will render to the screen
    //state.value controls which tab is active and visible
    this.state = {
      user: {
        dogname: '',
        dogAge: '',
        dogBreed: '',
        picLink: '',
        firstname: '',
        lastname: '',
        loc: '',
        email:''
      }
    }
  }

  componentWillMount() {
    var self = this;
    findUserByUsername(self.props.params.id)
      .then(response => {
        console.log('user response:',response.user)
        self.setState({
          user: response.user
        })
      })
  }

  // Changes active / visible tab
  handleChange(value) {
    this.setState({
      value: value
    })
  }

  render () {

    return (
      <div>
        <NavLoggedIn auth={this.props.auth} toggleDrawer={this.props.toggleDrawer}/>
        <Banner display={this.state.user.dogname} profileType= "DogProfile"/>
        <div className="container" style={{marginBottom: 20}}>


          <div className="col-md-9 profile-events">
            <MuiThemeProvider muiTheme={getMuiTheme(MyTheme)} >
              <Tabs
                style={{backgroundColor: 'whitesmoke', paddingBottom: '8px'}}
                value={this.state.value} >
                <Tab label="Details" value='a' onActive={() => this.handleChange('a') }>
                  <div className="dogwrapper">
                    <div className="leftcolumn-dog-details">
                      <div className="profile-image-dog-details">
                        <img src={this.state.user.picLink} alt="Pic"/>
                      </div>
                    </div>
                    <div className="rightcolumn-dog-details">
                      <h4 className="renttitle">Rent Me for $10</h4>
                      <h4><em>Name:</em> {this.state.user.dogname}</h4>
                      <h4><em>Breed:</em> {this.state.user.dogBreed}</h4>
                      <h4><em>Age:</em> {this.state.user.dogAge}</h4>
                      <br />
                      <h4><em>Owner's Name:</em> {this.state.user.firstname} {this.state.user.lastname}</h4>
                      <h4><em>Location:</em> {this.state.user.loc}</h4>
                      <h4><em>Contact:</em> {this.state.user.email}</h4>
                    </div>
                  </div>
                </Tab>

              </Tabs>
            </MuiThemeProvider>
          </div>
        </div>
        <FooterLoggedIn />
      </div>
    )
  }
}

// Make sure auth0 Service is passed in
// correctly as a prop
DogProfile.propTypes = {
  location: T.object,
  auth: T.instanceOf(AuthService)
};


//extra tab
//<Tab label="~" value='b' onActive={() => this.handleChange('b') }>
//                  <div>
//                    <EventList type="profile" events={this.state.createdEvents} noEvents={this.state.noCreatedEvents} userInfo={this.props.userInfo}/>
//                  </div>
//                </Tab>
// <Tab label="~" value='c' onActive={() => this.handleChange('c') }>
//                  <div>
//                    <EventList type="profile" events={this.state.pastEvents} noEvents={this.state.noPastEvents} userInfo={this.props.userInfo}/>
//                 </div>
//               </Tab>
//sidebar profile not needed
//<div className="col-md-3 profile">
//            <DogProfileDisplay userInfo={this.props.userInfo} resetUserInfo={this.props.resetUserInfo}/>
//</div>

module.exports = DogProfile;