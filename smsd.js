const fastify = require("fastify");
const serialportgsm = require('serialport-gsm');
const sgMail = require('@sendgrid/mail')

class ModemApp {
    modem = serialportgsm.Modem();
    isOpen = false

    constructor() {
        this.modem.on('onNewMessage', this.onNewMessage);
        this.modem.on("open", this.onOpen);

        this.modem.open("/dev/ttyUSB0", {}, () => {
            console.log("Connected to modem...")

            console.log("Deleting all SIM messages...")
            this.modem.deleteAllSimMessages(() => console.log("Deleting SIM messages completed!"))
        })
    }

    onNewMessage = messageDetails => {
        // send email
        console.log(messageDetails)
        sendEmail(messageDetails)
    }

    onOpen = () => {
        this.isOpen = true;
    }

    getInbox = () => new Promise((resolve, reject) => {
        if (this.isOpen === false) {
            reject("Modem isn't open")
        }
        this.modem.getSimInbox(resolve);
    })
}

const modemApp = new ModemApp()

const app = fastify();

app.register(require('point-of-view'), {
    engine: {
        ejs: require('ejs')
    }
});

app.get("/", async (req, reply) => {
    const result = await modemApp.getInbox();
    return reply.view('/templates/get.ejs', { messages: result.data.reverse() })
});

app.listen(4000, '0.0.0.0', function (err, address) {
    if (err) {
        console.error(err)
        process.exit(1)
    }
    console.info(`Server listening on ${address}`)
});


const sendEmail = async (contents) => {
    sgMail.setApiKey(process.env.SENDGRID_API_KEY)
    const msg = {
        to: 'johnwiseheart@gmail.com', // Change to your recipient
        from: 'johnwiseheart@gmail.com', // Change to your verified sender
        subject: 'SMS Received on Australian Number',
        html: `<strong>Recieved from ${contents.sender} at ${contents.dateTimeSent}</strong><br /><br />${contents.message}`,
    }
    await sgMail
        .send(msg)
        .then(() => {
            console.log('Email sent')
        })
        .catch((error) => {
            console.error(error)
        })
}