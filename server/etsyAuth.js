module.exports = function etsyAuth( key, secret, domain, callback ) {

	var oauth = require("oauth").OAuth;

    var that = this;

    this.o = new oauth(
    	//The response to our API hit for the request_token will contain temporary credentials, including a field 
    	//called login_url (this is the page where you allow our app to see the client's Etsy acct) 
        "https://openapi.etsy.com/v2/oauth/request_token?scope=favorites_rw",
        "https://openapi.etsy.com/v2/oauth/access_token",
        key,	
        secret,
        "1.0",
		domain + ( callback || "/auth/etsy/callback" ),
        "HMAC-SHA1"
    );

    this.getRequestToken = function getRequestToken( req, res ) {
        that.o.getOAuthRequestToken( function( err, token, token_secret, results ){
            if ( err ) {
                console.log( err );
            } else {
            	//create an oauth obj for this session
                req.session.oauth = {};
                //assign the token
                req.session.oauth.token = token;
                //and token_secret
                req.session.oauth.token_secret = token_secret;
                //redirect the user to the login_url that allows them to approve our access
                res.redirect( results[ "login_url" ] );
            }
        });
    };

    this.getAccessToken = function getAccessToken( req, res, callback ) {
    	//if our oauth token is the same as the oauth token from the client get the access token (that will allow us access to their acct)
        if ( req.session.oauth && req.session.oauth.token == req.query.oauth_token ) {
        	//set the token
        	var oauth_token = req.query.oauth_token;
        	//secret
        	var token_secret = req.session.oauth.token_secret;
        	//verifier (ACCESS TOKEN) 
        	var oauth_verifier = req.query.oauth_verifier;
            
            that.o.getOAuthAccessToken(
            	//this is the token that is received from the RequestingToken function
            	//coming from ETSY, verified by both session and ETSY
                oauth_token,
                //this is the secret from the RequestingToken function 
                //(its our standard secret, coming from session)
                token_secret,
                //this is the verifier (ACCESS TOKEN) that unlocks their account to us (coming from ETSY)
                oauth_verifier, 
                //now that we have all of our keys allow us to access the account & redirect to /me
                function( err, token, token_secret, results ){
                    if ( err ){
                        console.log( err );
                    } else {
                    	//final access tokens
                    	//these are stored in session as well
                        req.session.oauth.access_token = token;
                        req.session.oauth.access_token_secret = token_secret;
                        if ( callback ) callback.call( this, req, res );
                        res.redirect("/my_favorite_listings")
                    }
                }
            );
        }
        //if we dont have the correct keys/credentials redirect us back to the login
        else {
        	res.redirect("/")
        }
    };

    //this function allows us to getResources from the API
    this.getResource = function(request, response, url, callback){
    	//we need to send our token and secret to verify its us to the API
    	user_token = request.session.oauth.access_token;
  		user_secret = request.session.oauth.access_token_secret;
  		//send the keys and call a callback function
    	this.o.get(url, user_token, user_secret, function (err, data, res) {
    		//use the data from the get request in the callback function
    		callback(data)
    	});
    };

    return this;
}