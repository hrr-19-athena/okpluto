'use strict';

var User = require('../models/users');
var Event = require('../models/events');
// import dependencies
var request = require('request');
require('dotenv').config();
// var configKey = require('../../config/api.js');
var apiKeys = process.env.API_KEY;
// import API keys
// var authPath = require('../../config/auth0');
var preData = require('../../config/data');
// var api = require('../../config/api.js');
var Promise = require('bluebird');
const googleMaps = require('@google/maps').createClient({
	key: apiKeys
});
const aws = require('aws-sdk');
const S3_BUCKET = 'okpluto';

module.exports = function(app) {

	//======== Picture upload to AWS =======//
	app.get('/sign-s3', (req, res) => {
		aws.config.region = 'us-east-2';
  	aws.config.accessKeyId = process.env.ACCESS_Key_ID;
  	aws.config.secretAccessKey = process.env.SECRET_ACCESS_Key;
		const s3 = new aws.S3();
		console.log('query: ', req.query);
		const fileName = req.query['file-name'];
		const fileType = req.query['file-type'];
		const s3Params = {
			Bucket: S3_BUCKET,
			Key: fileName,
			Expires: 600,
			ContentType: fileType,
			ACL: 'public-read'
		};
		s3.getSignedUrl('putObject', s3Params, (err,data) => {
			if(err) {
				console.log('get signed url error:', err)
				return res.end();
			}
			const returnData = {
				signedRequest: data,
				url: `https://s3.${aws.config.region}.amazonaws.com/${S3_BUCKET}/${fileName}`
			};
			res.status(200).send(JSON.stringify(returnData));
		})

	})

	//======Location End Points=======//

	//Find Latitude and Longitude of an address / location
	app.get('/api/geocode', (req, res) => {
    var getCoordinates = function(address) {
    	return new Promise(function(resolve, reject) {
    		googleMaps.geocode({ address: address }, function(err, res) {
    			if (err) reject(err);
    			resolve(res.json.results[0].geometry.location);
    		});
    	});
    };

    getCoordinates(req.query.loc)
      .then(function(results) {
      	res.status(200).send(results);
      });
	});

	//Find distance btwn coordinates
	app.post('/api/distance', (req, res) => {
		var getDistance = function(originCoor, destCoors) {
			return new Promise((resolve, reject) => {
				googleMaps.distanceMatrix({
					origins: originCoor,
					destinations: destCoors
				}, (err, res) => {
					if (err) reject(err);
					resolve(res)
				})
			})
		}

		getDistance(JSON.parse(req.body.origin), JSON.parse(req.body.destinations))
		.then(results => {
			res.status(200).send(results.json.rows[0].elements)
		})
	})

	//======User End Points=======//

	app.get('/query/dbId', (req, res) => {
		User.findById(req.query.dbId)
		.exec((err, user) => {
			if (err) console.log(err);
			res.status(201).send(user)
		});
	});
  // GET request to return all users from db
	app.get('/api/users', (req, res) => {
		User.find()
		.exec((err, users) => {
			if (err) {
				console.log(err);
				res.status(404).send('Database error, no users found')
			}
			console.log('user list:',users);
			res.status(201).send({users: users});
		});
	});

	app.get('/api/username', (req, res) => {
		User.findOne({username: req.query.username})
		.exec((err, user) => {
			if (err) {
				console.log(err);
				res.status(404).send('Database error, no users found')
			}
			console.log('user:', user);
			res.status(200).send({user: user});
		});
	});

	app.post('/signin', (req, res) => {
		//Auth0 user ID
		var id = req.body.id;
		//POST path to retrieve user info from Auth0
		var url = 'https://' + 'vivou.auth0.com' + '/tokeninfo';
		request.post(url, { json: {id_token: id} } , (err, response) => {
			if (err) console.log(err)
			//Look for user in mongoDB
			User.findOne({
				'id': response.body.user_id
			}).exec((err, user) => {
				//Add user if they don't exist
				if (!user) {
					//get user info supplied through login / signup from FB, Google and Auth0
					var userData = response.body;
					//For signups through Auth0 collect metadata
					if (userData.user_metadata) {
						for (var key in userData.user_metadata) {
							userData[key] = userData.user_metadata[key];
						}
					}
					if (userData.picture_large) {
						userData.picture = userData.picture_large;
					}
					//Create user in mongoDB
					new User ({
						id: userData.user_id,
						firstname: userData.given_name,
						lastname: userData.family_name,
						profilepic: userData.picture,
						username: 'anonymous' + Math.floor(Math.random()*100000000)
					}).save((err, user) => {
						if (err) console.log(err);
						res.status(200).send({user: user, creation: true});
					})
				} else {
					user.creation = false;
					res.status(200).send({user: user, creation: false});
				}
			})
		})
	});

	//pre-populate database with data in config/data.js
	app.get('/api/populate', (req, res) => {
		preData.forEach(user => {
			User.findOne({
				'id': user.id
			}).exec((err, existingUser) => {
					if (!existingUser) {
					//Create user in mongoDB
					new User ({
						id: user.id,
						firstname: user.firstname,
						lastname: user.lastname,
						profilepic: user.profilepic,
						username: user.username,
						loc: user.loc,
					  lat: user.lat,
					  lng: user.lng,
					  picLink: user.picLink,
					  dogname: user.dogname,
					  dogLikes: user.dogLikes,
					  dogBreed: user.dogBreed,
					  dogAge: user.dogAge,
					  events: user.events,
					  rentDog: user.rentDog,
					  email: user.email,
					  phone: user.phone
					}).save((err, user) => {
						if (err) console.log(err);
						console.log('user saved:',user);
					})
				}
			})
		});
		res.status(200).send(preData);
	});


  // update users by finding their id from the db
	app.put('/api/users', (req, res) => {
		User.findById(req.body.dbId, (err, user) => {
			for (var key in req.body) {
				if (key !== 'dbId') {
					user[key] = req.body[key];
				}
			}
			user.save((err, updatedUser) => {
				res.status(200).send(updatedUser);
			})
		})
	});
  // delete users from the db by their id
	app.delete('/api/users', (req, res) => {
		User.findByIdAndRemove(req.body.dbId)
		.exec((user) => {
			res.status(200).send(userRemoved);
		})
	});

	//======Event End Points=======//
	app.get('/api/events', (req, res) => {
		Event.find()
		.exec((err, events) => {
			if (err) {
				console.log(err);
				res.status(404).send('Database error, no events found');
			}
			res.status(201).send({events: events});
		});
	});

	app.get('/queryEvents/dbId', (req, res) => {
		Event.find({attendees: req.query.dbId})
		.exec((err, attendingEvents) => {
			Event.find({creator: req.query.dbId})
			.exec((err, createdEvents) => {
				if (err) {
				console.log(err);
				res.status(404).send('Database error, no events found');
			} else {
				res.status(201).send({attendingEvents: attendingEvents, createdEvents, createdEvents});
			}
			})
		})
	})
  // post a new event
	app.post('/api/events', (req, res) => {
		req.body = JSON.parse(req.body.data);
		new Event ({
			creator: req.body.creator,
			eventname: req.body.eventname,
			category: req.body.category,
			loc: req.body.loc,
			lat: req.body.lat,
			lng: req.body.lng,
			date: req.body.date,
			time: req.body.time,
			attendees: req.body.attendees
		}).save((err, event) => {
			if (err) throw err
			res.status(200).send({event: event});
		});
	})

	app.put('/api/events/add', (req, res) => {
		Event.findById(req.body.eventId, (err, event) => {
			let attendees = event.attendees;
			if (attendees.indexOf(req.body.userId) === -1) {
				attendees.push(req.body.userId);
			}
			event.attendees = attendees;
			event.save((err, updatedEvent) => {
				res.status(200).send({updatedEvent: updatedEvent})
			});
		});
	});

	app.put('/api/events/remove', (req, res) => {
		Event.findById(req.body.eventId, (err, event) => {
			let attendees = event.attendees;
			let index = -1;
			for (var i = 0; i < attendees.length; i++) {
				if (attendees[i] === req.body.userId) {
					index = i;
					break;
				}
			}
			event.attendees.splice(index, 1)
			event.save((err, updatedEvent) => {
				res.status(200).send({updatedEvent: updatedEvent});
			});
		});
	});

	app.delete('/api/events', (req, res) => {
		Event.findByIdAndRemove(req.body.eventId, (err, event) => {
			res.status(201).send({removedEvent: event});
		});
	});
};