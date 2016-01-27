'use strict';

var request = require("supertest-as-promised");

const instance_url = process.env.INSTANCE_URL,
      specHelper = require("../support/specHelper");

describe("User Flow", () => {
    let app,
        memberSuffix,
        createdInoviceId;

    let member = {
        "firstName": "Sherlock",
        "lastName": "Holmes",
        "email": `sherlock${memberSuffix}@holmes.co.uk`,
        "dateOfBirth": "22/12/1900",
        "primaryPhoneNumber": "0396291146",
        "secondaryPhoneNumber": null,
        "gender": "horse radish",
        "residentialAddress": {
            "address": "222b Baker St",
            "suburb": "London",
            "country": "England",
            "state": "VIC",
            "postcode": "1234"
        },
        "postalAddress": {
            "address": "303 collins st",
            "suburb": "melbourne",
            "country": "australia",
            "state": "VIC",
            "postcode": "3000"
        },
        "membershipType": "full"
    };

    let invoice = {
        "memberEmail": `sherlock${memberSuffix}@holmes.co.uk`,
        "totalAmount": "88.88",
        "paymentType": "deposit",
        "invoiceId": '',
        "uuid": "1234",
        "membershipType": "full"
    };


    let hasNewMemberAndInvoiceId = (res) => {
        if (!('newMember' in res.body)) throw new Error("missing created member");
        if (!('invoiceId' in res.body)) throw new Error("missing invoiceId");
        createdInoviceId = res.body.invoiceId;
    }

    let hasErrors = (res) => {
        if (!('errors' in res.body)) throw new Error("missing errors");
        if (res.body.errors[0].name !== 'SequelizeUniqueConstraintError') throw new Error("Wrong error message!");
    }

    let successfullyCreatingANewMemberShouldRepondWithA200 = () => {
        return request(app)
            .post("/members")
            .set("Content-Type", "application/json")
            .set("Accept", "application/json")
            .send(member)
            .expect(200)
            .expect(hasNewMemberAndInvoiceId);
    };

    let postMemberWithExistEmailShouldRespondWithA500 = () => {
      return request(app)
          .post("/members")
          .set("Content-Type", "application/json")
          .set("Accept", "application/json")
          .send(member)
          .expect(500)
          .expect(hasErrors);
    };

    let successfullyCreateInvoiceShouldRespondWithA200 = () => {
        return request(app)
            .post("/invoices")
            .set("Content-Type", "application/json")
            .set("Accept", "application/json")
            .send(invoice)
            .expect(200);
    };


    beforeEach(() => {
        if (instance_url) {
            app = instance_url;
            memberSuffix = Date.now();
        }
        else {
            app = require("../../app");
            memberSuffix = "";
        }
    });

    it ("member sign up with duplicate email should fail", (done) => {
        successfullyCreatingANewMemberShouldRepondWithA200()
            .then(postMemberWithExistEmailShouldRespondWithA500)
            .nodeify(done)
            .catch((err) => {
                done.fail(err);
            });
    }, 60000);

    it ("a new member successfully signs up and then makes a payment", (done) => {
      invoice.invoiceId = createdInoviceId;
      
      successfullyCreatingANewMemberShouldRepondWithA200()
          .then(successfullyCreateInvoiceShouldRespondWithA200)
          .nodeify(done)
          .catch((err) => {
              done.fail(err);
          });
    }, 60000);
});
