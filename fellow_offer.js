var worker  = require('node_helper');
var jsforce = require('jsforce');
var _       = require('lodash');
var Q       = require('q');

var streakapi  = require('streakapi');
var streak     = new streakapi.Streak(worker.config.STREAK_API_KEY);

// Connect to VFA's Salesforce Database // 
var conn = new jsforce.Connection({
	instanceUrl: worker.config.INSTANCE_URL,
	loginUrl: worker.config.LOGIN_URL,
	redirectUri: worker.config.REDIRECT_URI,
	clientSecret: worker.config.CLIENT_SECRET,
	clientId: worker.config.CLIENT_ID
});

// Get Fellow Fields from Salesforce //
var fellowId = worker.params.dsfs__Contact__c;

// Initialize Streak Fields // 
var boxKey;

// getting too fancy. would be great with 1,000 fields. this is just extra work.
// don't refactor too soon.

var emailData = {
	key: '1001',
	value: ""
};

var schoolData = {
	key: '1002',
	value: ""
};

var majorData = {
	key: '1003',
	value: ""
};

var phoneData = {
	key: '1009',
	value: ""
}

var hometownData ={
	key: '1013',
	value: ""
}; 

var gradYear = {
	key: '1014',
	value: ""
};

var round = {
	key: '1005',
	value: ""
}

var salesforceProfile = {
	key: '1015',
	value: ""
}

// Login to VFA's Salesforce Database //
conn.login(worker.config.USER_EMAIL, worker.config.PASSWORD, function(err, userInfo) {
	if(fellowId) {
		conn.sobject('Contact').retrieve(fellowId, function(err, fellow) {
			if (err) { return console.error(err); }
			// console.log("Fellow Data:", fellow );
			var boxName = {
				name: fellow.Name
			};

			if(fellow.Email) {
				emailData.value = fellow.Email;
			}

			if(fellow.Alma_mater__c) {
				schoolData.value = fellow.Alma_mater__c;
			}
			if(fellow.Major__c) {
				majorData.value = fellow.Major__c;
			}

			if(fellow.Phone) {
				phoneData.value = fellow.Phone;
			}

			if(fellow.Graduation_Year__c) {
				gradYear.value = fellow.Graduation_Year__c;
			}

			salesforceProfile.value = "https://na14.salesforce.com/" + fellowId;

			conn.sobject('Contact').update({
				Id: fellowId,
				VFA_Association: "Fellow",
				Years__c: "2016"
			}, function(err, ret) {
				var updateBoxData = function updateBoxData(boxKey, data) {
					var deferred = Q.defer();
					streak.Boxes.Fields.update(boxKey, data)
						.then(function(response) {
							console.log("response to box update:", response);
							deferred.resolve();
						}), function(error) {
							console.error("error updating box:", error);
							deferred.reject(error);
						}
						return deferred.promise;
				}

				// Create Streak Box for new Fellow with Fellow's Name //
				streak.Boxes.create(worker.config.PIPELINE_KEY, boxName)
					// Update Box to include Fellow data (kind of stupid I know) //
					.then(function(newBoxInfo) {
						boxKey = newBoxInfo.boxKey;
						console.log("box key:", boxKey);
						updateBoxData(boxKey, emailData)
							.then(updateBoxData(boxKey, schoolData))
							.then(updateBoxData(boxKey, phoneData))
							.then(updateBoxData(boxKey, majorData))
							.then(updateBoxData(boxKey, gradYear))
							.then(updateBoxData(boxKey, salesforceProfile))
							.then(function() {
								streak.Boxes.Fields.getForBox(boxKey)
									.then(function(response) {
										console.log("box fields:", response);
										conn.sobject('Contact')
											.update({Id: fellowId, Streak_Box__c: boxKey}, function(err, ret) {
												if(err) { return console.error(err); }
												console.log("update result:", ret);
											});
									});
							})
					});

			})

				
				
					
		});
	}
})

console.log("worker config: ", worker.config);
console.log("worker params: ", worker.params);
console.log("worker id: ", worker.task_id);s