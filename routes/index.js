const express = require('express');
const router = express.Router();
const authenticate = require('../Config/Authenticate');
const responseHandler = require('../Config/Responsehandler');

const conf = require('../Config/Utils')
const redis = require('redis');
// i used redis which is an in-memory data structure store to save token
const client = redis.createClient(conf.URI); //creates a new client

router.get('/', function (req,res,next) {

    res.send('Welcome to Text justifier')
})



router.post('/api/justify',authenticate.verifyOrdinaryUser,function(req, res, next) {

    res.set('Content-Type', 'text/plain');

    let token = req.body.token || req.query.token || req.headers['x-access-token'] ||  req.headers['authorization']

    let inputText = req.body ;

    let words_number = inputText.split(' ').length;

    console.log(words_number)

    inputText = inputText.trim().split(" ")

    let finalResult = textJustification(inputText,80).join("\r\n") // store textafter edit
    let today = new Date(); //getting the current date to count how much time left for free text justifiing

    let remaining_time_for_token = ((24-today.getHours()) * 3600) + ( (60 - today.getMinutes()) * 60 ) +today.getSeconds();

    //time left in this journey to use api ;)

    client.exists(token, function(err, reply) {

        if (reply === 1) {

            client.get(token, function(err, reply) {

                let difference = 80000 - reply

                if(reply <= 80000 && difference > words_number )
                {
                    client.incrby(token, words_number)

                    res.send(finalResult)
                }
                else
                {
                    responseHandler.resHandler(false,null,'Payment required',res,402)
                }
            });

        } else {

            if(words_number < 80000 )
            {
                client.set(token, words_number)
                client.expire(token, remaining_time_for_token);
                res.send(finalResult)
            }
            else {
                responseHandler.resHandler(false,null,'Payment required',res,402)
            }
        }
    });
});

router.post('/api/token', function (req,res,next) {
    let email = req.body
    let token = authenticate.getToken(email)
    let result = {
        token : token,
        email : email.email
    }
    res.send(result)
})

// text justifing logic
function textJustification(words, L) {
    let lines = [], index = 0;

    while(index < words.length) {
        let count = words[index].length;

        let last = index + 1;

        while(last < words.length) {
            if (words[last].length + count + 1 > L) break;
            count += words[last].length + 1;
            last++;
        }
        let line = "";

        let difference = last - index - 1;

        if (last === words.length || difference === 0) {
            for (let i = index; i < last; i++) {
                line += words[i] + " ";
            }

            line = line.substr(0, line.length - 1);
            for (let i = line.length; i < L; i++) {
                line += " ";
            }
        } else {
            let spaces = (L - count) / difference;

            let remainder = (L - count) % difference;

            for (let i = index; i < last; i++) {
                line += words[i];

                if( i < last - 1) {
                    let limit = spaces + ((i - index) < remainder ? 1 : 0)
                    for (let j = 0; j <= limit; j++) {
                        line += " ";
                    }
                }
            }
        }
        lines.push(line);
        index = last;
    }
    return lines
}


module.exports = router;
