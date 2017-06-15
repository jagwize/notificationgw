// app/routes.js
// Controllers

//var pushconfig = require('./config/pushconfig'); // get push config file

var pushmanager = require('./controller/pushnfmanager'); // get push config file

module.exports = function (app) {

    // ROUTES

    //sample get api
    app.get('/api/:verson/api1/:id', function (req, res) {

        res.json({
            "api_response": {
                "status": "succesful",
                "message": "Hello from server. You invoked a get " + req.params.version + "/api1 with parameter id value " + req.params.id
            }
        })
    });

    //sample get POST api
    app.post('/api/:verson/api2/:id', function (req, res) {
        res.json({
            "api_response": {
                "status": "succesful",
                "message": "Hello from server. You invoked " + req.params.version + "/api1 with parameter id value " + req.params.id
            }
        })
    });

    // Sample api to test push message
    app.post('/api/:verson/nftest', function (req, res) {



        var messagePayload = {
            type: req.body.type,
            lesson_id: req.body.lesson_id,
            message: req.body.message,
            title: "Test Message",
            event_sub_type: "New Lesson",
            event_by_id: "1234567",
            iphone_device_tokens: req.body.your_device_ids
        }
        pushmanager.sendMessage1(messagePayload, function (err) {
            console.log("Done with sending out the message");

            var resp_payload = {
                "api_response": {
                    "status": "succesful",
                    "message": "Hello from server. Push message  sent to APN to deliver to your device.Please check he console.log for more details"
                }
            }
            if (err) {
                resp_payload.api_response.status = "Error"
                resp_payload.api_response.message = err;

            }
            else {

            }
            res.json(resp_payload);
        });

    });

};





