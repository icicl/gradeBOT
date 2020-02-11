// AUTHENTICATION
const Discord = require("discord.js"); //https://discord.js.org/#/docs/main/stable/general/welcome
const client = new Discord.Client(); //Get "npm install opusscript"


// CONFIGURATION FILES
const config = require("./config/config.json");

// MODULES 
const fs = require("fs");
const path = require('path')
const staff = require("./staff.json");

// LOGIN
client.login(config.token);

let guildchannel = null;
let ccbinds = {};
let u = '178413';
let p = null;
let usercontacttimeout = 0;
let Staff = {};

client.on("ready", () => {
if (fs.existsSync(__dirname + '/d/cid')) {
        guildchannel = client.channels.get(fs.readFileSync(__dirname + '/d/cid').toString());
}
for (var f of fs.readdirSync(__dirname + '/d/')){
    if (fs.lstatSync(__dirname + '/d/' + f).isDirectory() && fs.existsSync(__dirname + '/d/' + f + '/ccid')){
        ccbinds[f] = client.channels.get(fs.readFileSync(__dirname + '/d/' + f + '/ccid').toString());
    }
}
    //console.log(guildchannel);
    let date = new Date();
    console.log('\x1b[33m', `gradeBOT has started on ${date}.`);
    client.user.setActivity(
        'eddymoney bot is 🦀'
    );
    client.user.setStatus('online');
    setInterval(async () => {
        g2(u, p)
    }, (10 * 60 * 1000));
});

// BOT COMMANDS

client.on("message", async message => {
    if (message.author.bot) return;
    if (!message.guild) {
        let app = await client.fetchApplication();
        let owner = await client.fetchUser(app.owner.id);
        if (message.author === owner){
            p = message.content;
            owner.send('input recieved');
        }
    } else {
        if (message.content === ",cbind") {//binds all updates to channel
            message.channel.send('This channel will be used for all classes.');
            message.delete();
            guildchannel = message.channel;
            fs.writeFileSync(__dirname + '/d/cid', message.channel.id);
        } else if (message.content.slice(0, 6) === ",rbind") {//binds role to class
            message.delete();
            if (fs.existsSync(__dirname + '/d/' + message.content.split(' ')[1])) {
                fs.writeFileSync(__dirname + '/d/' + message.content.split(' ')[1] + '/id', message.content.split(' ')[2].slice(1));
            }
        } else if (message.content.slice(0, 7) === ",ccbind") {//binds class to channel
            message.delete();
            if (fs.existsSync(__dirname + '/d/' + message.content.split(' ')[1])) {
                ccbinds[message.content.split(' ')[1]]=message.channel;
                fs.writeFileSync(__dirname + '/d/' + message.content.split(' ')[1] + '/ccid', message.channel.id);
                message.channel.send('Updates for \`'+fs.readFileSync(__dirname + '/d/' + message.content.split(' ')[1] + '/name.txt')+'\` will be sent in this channel.');
            } else {message.channel.send('I dont recognize that class id');}
        } else if (message.content === ",help") {
            message.delete();
            message.channel.send('`,rbind classid roleid`:binds role to class - ex. `,rbind S192 \@ap physics`\n`,cbind`:binds channel to be used for sending every updates');
        }
    }
});
const request = require('request')


const axios = require("axios");
AxiosInstance = axios.create({
    baseURL: "https://student.ouhsd.k12.ca.us/Service/PXPCommunication.asmx"
});
const xmlParser = require('xml2json');
async function g2(u, p) {
    if (p === null) {
        if (usercontacttimeout===0){
            let app = await client.fetchApplication();
            let owner = await client.fetchUser(app.owner.id);
            owner.send('Hi, it\'s me again, gradeBOT. My host computer died *again* \~\~thx ian\~\~, so I need your password!');
        }
        usercontacttimeout++;
        usercontacttimeout%=6;
        return;
    }
    const response = await AxiosInstance.post("/ProcessWebServiceRequest", {
        userID: u,
        password: p,
        skipLoginLog: true,
        parent: false,
        webServiceHandleName: "PXPWebServices",
        methodName: 'Gradebook',
        paramStr: '<Parms><ChildIntID>0</ChildIntID><ReportPeriod>7</ReportPeriod></Parms>'
    });

    let gjson = JSON.parse(xmlParser.toJson(response.data.d));
    let gdata = gjson.Gradebook.Courses.Course;
    for (let c of gdata) {//for classes
        let t = c.Title;
        var cid = t.split('(');//class id
        cid = cid[cid.length - 1];
        cid = cid.slice(0, cid.length - 1);
        let s = c.Staff;
        if (s.toLowerCase() in staff.staff_members){
            Staff[cid] = [s,true,staff.staff_members[s.toLowerCase()]];
        } else {
            Staff[cid] = [s,false];
        }
        if (!fs.existsSync(__dirname + '/d/' + cid)) {
            fs.mkdirSync(__dirname + '/d/' + cid);
            fs.writeFileSync(__dirname + '/d/' + cid + '/name.txt', t);
            fs.mkdirSync(__dirname + '/d/' + cid + '/full')
            fs.mkdirSync(__dirname + '/d/' + cid + '/half')
        }

        if (typeof c.Marks.Mark.Assignments.Assignment !== 'undefined') {
            for (let a of c.Marks.Mark.Assignments.Assignment) {
                if (a.Score === "Not Graded" || a.Score === "Not Due") {
                    if (!fs.existsSync(__dirname + '/d/' + cid + '/half/' + a.GradebookID)) {
                        fs.writeFileSync(__dirname + '/d/' + cid + '/half/' + a.GradebookID, a.Points.split(' ')[0]);
                        half(a, cid, t);
                    }
                } else {
                    if (!fs.existsSync(__dirname + '/d/' + cid + '/full/' + a.GradebookID)) {
                        fs.writeFileSync(__dirname + '/d/' + cid + '/full/' + a.GradebookID, a.Points.split(' ')[0]);
                        full(a, cid, t);
                    }
                }
            }
        }
    }
}
function half(a, cid, t) {
    let p = a.Points.split(' ')[0];
    send(t + ':\nNew Ungraded Assignment: ' + a.Measure + ' added to gradebook with ' + p + ' points.', cid);
};
function full(a, cid, t) {
    let p = a.Points.split(' ')[0];
    send(t + ':\n' + a.Measure + ' has been graded and the score added to gradebook (out of ' + p + ' points).', cid);
};

function send(m, cid) {
    if (cid in ccbinds){
        ccbinds[cid].send(makeEmbed(m,cid));
    }
    if (fs.existsSync(__dirname + '/d/' + cid + '/id')) {
        m = fs.readFileSync(__dirname + '/d/' + cid + '/id') + '\n' + m;
    }
    if (guildchannel !== null) {
        guildchannel.send(makeEmbed(m,cid));
    }
}
function makeEmbed(m,cid){
    var e = new Discord.RichEmbed()
    .setColor('#009999')
	.setTitle(cid)
	.setAuthor(Staff[cid][0])
	.setDescription(m)
	.setTimestamp()
    .setFooter('courtesy of gradeBOT');
    if (Staff[cid][1]){
        e.setThumbnail(Staff[cid][2]);
    }
    return e;
}


//https://discordapp.com/oauth2/authorize?client_id=669387268963696671&permissions=3072&scope=bot