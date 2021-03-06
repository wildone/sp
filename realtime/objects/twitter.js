/**
 * Get tweets.
 *
 * @fileOverview
 * @author Luke Blaney
 */

var

events   = require('events'),
emtr     = new events.EventEmitter(),
apiKeys   = require('../../data/apikeys.json').twitter,
ntwitter = require('ntwitter'),
twit     = new ntwitter(apiKeys),
stream;

// The module is an EventEmitter
module.exports = emtr;


/**
 * Stop the Twitter stream.
 *
 * @private
 */
function stopStream() {
	if (!stream) {
		return;
	}

	stream.destroy();
	stream = null;
}


/**
 * Start the Twitter stream.
 *
 * @public
 */
function startStream() {


/*

	emtr.emit('post', {
		provider:  'twitter',
		id:        187236817263,
		message:   "David Cameron is a great prime minister, and he lives in London",
		timestamp: new Date().getTime(),
		user:      {
			realname: "George",
			username: "george",
			location: "London",
			avatar:   "http://www.google.co.uk/images/srpr/logo3w.png"
		}
	});

*/


	twit.stream('user', function(s) {
		stream = s;

		stream.on('data', function(tweet) {

			if (!tweet.text) {
				return;
			}

			// Wrap in a try catch so any errors aren't fatal and we can get a decent error message
			try {
				emtr.emit('post', {
					provider:  'twitter',
					id:        tweet.id,
					message:   tweet.text,
					timestamp: new Date(tweet.created_at).getTime(),
					user:      {
						realname: tweet.user.name,
						username: tweet.user.screen_name,
						location: tweet.user.location,
						avatar:   tweet.user.profile_image_url
					}
				});
			} catch (e) {
				console.log("Error after getting tweet", e);
			}
		});

		stream.on('end', function (response) {
			console.error("Twitter stream disconnected");

			// Destroy the stream
			stopStream();
		});

		stream.on('destroy', function (response) {

			// Handle a 'silent' disconnection from Twitter, no end/error event fired
			console.log("Twitter stream destroyed");
		});

		stream.on('error', function (errortype, errorcode) {
			console.log("Twitter experienced a "+errortype+" error "+errorcode);
		});
	});

	/* Get any existing tweets */
	twit.getFriendsTimeline(null, function (err, tweets){
		var i, l, tweet, timeoutIncr = 0;
		if (err) return;
		for (i=0, l=tweets.length; i<l; i++) {
			tweet = tweets[i];

			setTimeout(function() {
				emtr.emit('post', {
					provider:  'twitter',
					id:        tweet.id,
					message:   tweet.text,
					timestamp: new Date(tweet.created_at).getTime(),
					user:      {
						realname: tweet.user.name,
						username: tweet.user.screen_name,
						location: tweet.user.location,
						avatar:   tweet.user.profile_image_url
					}
				});
			}, 200 + timeoutIncr);

			timeoutIncr = timeoutIncr + 200;
			console.log("Twitter stream: received backlog tweet from %s", tweet.user.screen_name);
		}
	});
}

emtr.startStream = startStream;
