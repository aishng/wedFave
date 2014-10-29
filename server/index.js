var express     	= require('express'),
//allows us to keep users logged in based on their cookies
//no need to fetch new tokens every time 
session           = require('cookie-session'),
app             	= express(),
http       				= require('http'),
https             = require('https'),
//query             = require('./query')(app),
secrets           = require('./secrets')(app),
etsyAuth          = require('./etsyAuth');

app.server = http.Server(app);

//create middleware 'loggedin' router to handle all routes for signed in user
//if token exists allow it to go to next ....
//or you redirect to login (this way you dont need a database yet!)

var consumer_key = app.secrets.keyString,
  consumer_secret = app.secrets.sharedSecret,
  APIentry = "/auth/etsy",
  callback = "/auth/etsy/callback",
  //create a new instance of the etsyAuth
  o = new etsyAuth(consumer_key, consumer_secret, "http://localhost:8080", callback);

var query;

//for express session
app.use(session({secret: 'kitty kat'}));
//create shortcut to static pages
app.use(express.static(__dirname + '/../views'));

//at the root we render our index
app.get('/', function(req, res) {
    res.render('./index.ejs');
});


app.get('/search', function(req, res) {
    query = req.query.query;
    //var listing_ids = [];
    //var image_query = [];
    o.getResource(req, res, 
      "https://openapi.etsy.com/v2/listings/active/?keywords="+ query, function(raw_search_query) {
        search_query = JSON.parse(raw_search_query);
        // listing_images = search_query.results.forEach(function(listing) {
        //   o.getResource(
        //     req, 
        //     res, 
        //     "https://openapi.etsy.com/v2/listings/" + listing.listing_id + "/images",
        //     function(raw_image_query) {
        //       image_query = JSON.parse(raw_image_query)
        //     }
        //   )
        // });

        // for(i = 0; i < 25; i++) {
        //   listing_ids.push(search_query.results[i].listing_id);
        // }
        res.render('./index.ejs', search_query);
        //res.send(search_query);
        // console.log(listing_ids);
    });
    //res.send(image_query);
    // res.render('./index.ejs', search_query);
});

 //   for(i = 0; i <= listing_ids.length; i++) {
      //     listing_images_api = "https://openapi.etsy.com/v2/listings/" + listing_ids[i] + "/images";
      //     o.getResource(req, res, listing_images_api, function(raw_image_query) {
      //       image_query.push(JSON.parse(raw_image_query));
      //       //console.log('image_query: '+ image_query);
      //       //res.send(image_query);
      //   });
      // }


//when the go to the APIentry they are rerouted to etsy's site to approve the app
app.get( APIentry, function( req, res ) {
    o.getRequestToken( req, res );
});

//when the callback is hit, we call the getAccessToken function
app.get( callback, function( req, res ) {
    o.getAccessToken( req, res, function ( req, res ) {
        //we redirect within the function (in etsyAuth)
        //res.redirect( "/success.ejs" );
    });
});

//predetermined search buttons: dresses
app.get('/dresses', function(req, res) {
    o.getResource(req, res, 
      "https://openapi.etsy.com/v2/listings/active/?keywords=vintage+weddingdresses", 
      function(raw_search_query){
        search_query = JSON.parse(raw_search_query);
        //res.send(search_query);
        res.render('./index.ejs', search_query);
    })
});

//predetermined search buttons: veils
app.get('/veils', function(req, res) {
    o.getResource(req, res, 
      "https://openapi.etsy.com/v2/listings/active/?keywords=birdcage+veils", 
      function(raw_search_query){
        search_query = JSON.parse(raw_search_query);
        //res.send(search_query);
        res.render('./index.ejs', search_query);
    })
});

//predetermined search buttons: flower crowns
app.get('/crowns', function(req, res) {
    o.getResource(req, res, 
      "https://openapi.etsy.com/v2/listings/active/?keywords=wedding+flower+crowns", 
      function(raw_search_query){
        search_query = JSON.parse(raw_search_query);
        //res.send(search_query);
        res.render('./index.ejs', search_query);
    })
});

//predetermined search buttons: mason jars
app.get('/jars', function(req, res) {
    o.getResource(req, res, 
      "https://openapi.etsy.com/v2/listings/active/?keywords=wedding+mason+jars", 
      function(raw_search_query){
        search_query = JSON.parse(raw_search_query);
        //res.send(search_query);
        res.render('./index.ejs', search_query);
    })
});

//predetermined search buttons: placecards
app.get('/placecards', function(req, res) {
    o.getResource(req, res, 
      "https://openapi.etsy.com/v2/listings/active/?keywords=wedding+placecards", 
      function(raw_search_query){
        search_query = JSON.parse(raw_search_query);
        //res.send(search_query);
        res.render('./index.ejs', search_query);
    })
});

//predetermined search buttons: string market lights
app.get('/lights', function(req, res) {
    o.getResource(req, res, 
      "https://openapi.etsy.com/v2/listings/active/?keywords=wedding+market+lights", 
      function(raw_search_query){
        search_query = JSON.parse(raw_search_query);
        //res.send(search_query);
        res.render('./index.ejs', search_query);
    })
});

//when we hit /me (which is redirect to at the end of the getAccessToken function)
//we call the getResource function which accesses data from the Etsy API
app.get( "/my_favorite_listings", function(req, res) {
  //here we access the user data of myself
  o.getResource(req, res, "https://openapi.etsy.com/v2/users/__SELF__", function(raw_user_data) {
    //the data comes in raw, so we must parse it to read it as JSON
    user_data = JSON.parse(raw_user_data);
    //we need to target the user_id for the next request
    user_id = user_data.results[0].user_id;
    //we want to get all of my favorite listings from the API
    favorite_listings_url = "https://openapi.etsy.com/v2/users/" + user_id + "/favorites/listings"
    //call the getResource function again to receive the new data
    o.getResource(req, res, favorite_listings_url, function(listings_data) {
      //display it on the page
      res.send(listings_data);
    })
  });
});

app.server.listen(process.env.PORT || 8080);


