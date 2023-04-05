var nodemailer = require('nodemailer');
require('dotenv').config()

var config=require("../../config")
async function sendMail(Details, callback) {
       
    var transporter = nodemailer.createTransport({
        host: 'smtpout.secureserver.net',
        port: 465,
        ssl:  true,
        secure: true,

    auth: {
            user: config.email.service,
            pass: config.email.servicePass
            // user: "admin@sceem.org",
            // pass: "SceemAdmin123!@"
        },
        // tls: {rejectUnauthorized: false},
    });

    let mailOptions;
    if(Details[0].attachments){
         mailOptions = {
            from: config.email.service, // sender address
            to: Details[0].email, // list of receivers Details[0].email
            subject: Details[0].subject, // Subject line
            html: Details[0].body,// plain text body
              attachments: Details[0].attachments
         }}else{
     mailOptions = {
        from: config.email.service, // sender address
        to: Details[0].email, // list of receivers Details[0].email
        subject: Details[0].subject, // Subject line
        html: Details[0].body,// plain text body
    }};

    transporter.sendMail(mailOptions, function (err, info) {
        if(err){
            console.log("erooorrrr");

            console.log("This is error ", err);
        }
        else {
            console.log("email sent successfully info",info);
            callback(1);
        }
    });
    return;
}

module.exports={
    sendVerificationEmail: function(useremail,name,otp){
		var details = [];
        var _subject = "Email Verification";
        // var body="<div><p>Your Verification code is, 12345</div>";
        var body=`<html>

        <head>
          <style>
              body {
              font-family: 'Poppins';
            }
              .column1 {
                float: left;
                width: 50%;
              }
        
              .column2 {
                float: left;
                width: 50%;
              }
        
              .row:after {
                content: "";
                display:table;
                clear: both;
              }
        
              .card {
                box-shadow: 0 4px 8px 0 rgba(0, 0, 0, 0.2);
                padding: 16px;
                background-color: white;
                width: 600px;
               height:340px;
              }
               .image{
              margin-top: 15%;
              width:80%;
            }
          </style>
        </head>
        
        <body>
          <div class="card">
            <div class="row" style="margin-left:40px;">
              <div class="column1">
                <h4>Hello ${name}</h4>
                <div>Thanks for registering<br> with <b>Byrds!</b></div>
                <div style="font-size:14px;margin-top:10px;">Please use this otp to verify your account.</div>
                <div style="font-size:18px;margin-top:5px;letter-spacing: 5px">${otp}</div>
                <div style="font-size:14px;margin-top:10px;">Regards,<br> Team</div>
              </div>
            
            </div><br>
          </div>
        </body>
        
        </html>`;
        // var body=""
            details.push({
            email : useremail,
            subject : _subject,
            body : body,
        });
        console.log("🚀 ~ file: mailHelper.js ~ line 45 ~ details", details)

        var mail = sendMail(details,  function(sendEmailResult){
            console.log("email sent succcessfully, response~",sendEmailResult);
            return sendEmailResult;
        });		
     },

     sendWelcomeEmail : function(useremail,name){
      
      var details = [];
      var _subject = "Welcome to Byrds";
      // var body="<div><p>Your Verification code is, 12345</div>";
      var body=`<html>

      <head>
        <style>
            body {
            font-family: 'Poppins';
          }
            .card {
              width:300px;
              box-shadow: 0 4px 8px 0 rgba(0, 0, 0, 0.2);
              background-color: white;
            }
         .welcomeImg {
          width: 30%;
      }
          .login_button {
          background-color: #E6570E;
          border-radius: 0px;
          width:100%;
          color: white;
          border-color: #E6570E;
          font-family: 'Poppins';
          font-size: 15px;
      }
      
      .login_button:hover {
          background-color: #E6570E;
          color: white;
          border-color: #E6570E;
      }
        </style>
      </head>
      
      <body>
       <div>
      
                      <center><div class="card"> <center>
                          <div style="font-size: 18px; margin-top: 30px; font-family: poppins;"><br><div class="mt-3">${name}</div></div>
                          <p class="welcomeFeddup-text">Welcome to Byrds</p><img alt="" src="" class="welcomeImg" /></center><br />
                          <p style="font-family: Poppins;font-size: 15px; color: #FF8B66;">Your account has been verified!</p>
                          <Form class="forgot-email">
                              <center>
                                  <div style="width: 80%;">
                                      <a href="https://byrds-frontend.azurewebsites.net/login">   
                                  <Button
                                              variant="default" size="md" block
                                              type="submit"
                                              class="login_button"
                                          >
                                              Login Here
                                          </Button>
                                          </a>
                                          <br />
                                  </div><br />
                              </center>
                          </Form><br />
                      </Card>
                      </center>
                  </div >
      </body>
      
      </html>`;
      // var body=""
          details.push({
          email : useremail,
          subject : _subject,
          body : body,
      });
      console.log("🚀 ~ file: mailHelper.js ~ line 45 ~ details", details)

      var mail = sendMail(details,  function(sendEmailResult){
          console.log("email sent succcessfully, response~",sendEmailResult);
          return sendEmailResult;
      });	

   },

   
     sendResetPasswordOtp: function(useremail,name,otp){
      var details = [];
          var _subject = "Reset Password Code";
          // var body="<div><p>Your Verification code is, 12345</div>";
          var body=`<html>
  
          <head>
            <style>
                body {
                font-family: 'Poppins';
              }
                .column1 {
                  float: left;
                  width: 50%;
                }
          
                .column2 {
                  float: left;
                  width: 50%;
                }
          
                .row:after {
                  content: "";
                  display:table;
                  clear: both;
                }
          
                .card {
                  box-shadow: 0 4px 8px 0 rgba(0, 0, 0, 0.2);
                  padding: 16px;
                  background-color: white;
                  width: 600px;
                 height:340px;
                }
                 .image{
                margin-top: 15%;
                width:80%;
              }
            </style>
          </head>
          
          <body>
            <div class="card">
              <div class="row" style="margin-left:40px;">
                <div class="column1">
                  <h4>Hello ${name}</h4>
                  <div>Confirm Reset Password Request</div>
                  <div style="font-size:14px;margin-top:10px;">Please use this otp to reset your password.</div>
                  <div style="font-size:18px;margin-top:5px;letter-spacing: 5px">${otp}</div>
                  <div style="font-size:14px;margin-top:10px;">Regards,<br> Team</div>
                  <img src="" style="width:20%;margin-top:10px;" />
                </div>
                <div class="column2">
                  <img src="" class="image"/>
                </div>
              </div><br>
            </div>
          </body>
          
          </html>`;
          // var body=""
              details.push({
              email : useremail,
              subject : _subject,
              body : body,
          });
          console.log("🚀 ~ file: mailHelper.js ~ line 45 ~ details", details)
  
          var mail = sendMail(details,  function(sendEmailResult){
              console.log("email sent succcessfully, response~",sendEmailResult);
              return sendEmailResult;
          });		
       },

     passwordResetSuccessfullyEmail : function(useremail,name){

        var details = [];
        var _subject = "Password Reset Success";
        // var body="<div><p>Your Verification code is, 12345</div>";
        var body=` <html>

        <head>
          <style>
              body {
              font-family: 'Poppins';
            }
              .column1 {
                float: left;
                width: 50%;
              }
        
              .column2 {
                float: left;
                width: 50%;
              }
        
              .row:after {
                content: "";
                display:table;
                clear: both;
              }
        
              .card {
                box-shadow: 0 4px 8px 0 rgba(0, 0, 0, 0.2);
                padding: 16px;
                background-color: white;
                width: 600px;
               height:340px;
              }
               .image{
              margin-top: 15%;
              width:80%;
            }
          </style>
        </head>
        
        <body>
          <div class="card">
            <div class="row" style="margin-left:40px;">
              <div class="column1">
              <h4>Password Reset Success</h4>
                <h4>Hi ${name},</h4>
               
                <div style="font-size:14px;margin-top:10px;">Your Password Changed Successfully.</div>
                <div style="font-size:14px;margin-top:10px;">You can use your new password to login.</div>
                <div style="font-size:14px;margin-top:10px;">Regards,<br> Team</div>
                <img src="" style="width:20%;margin-top:10px;" />
              </div>
              <div class="column2">
                <img src="" class="image"/>
              </div>
            </div><br>
          </div>
        </body>
        
        </html>`;
        // var body=""
            details.push({
            email : useremail,
            subject : _subject,
            body : body,
        });
        console.log("🚀 ~ file: mailHelper.js ~ line 45 ~ details", details)

        var mail = sendMail(details,  function(sendEmailResult){
            console.log("email sent succcessfully, response~",sendEmailResult);
            return sendEmailResult;
        });	
      } , 
      
      sendEchoEcoReportEmail : function(useremail,name){
      
        var details = [];
        var _subject = "API Report Requested ";
        var body=`<html>
  
        <head>
          <style>
              body {
              font-family: 'Poppins';
            }
              .card {
                width:300px;
                box-shadow: 0 4px 8px 0 rgba(0, 0, 0, 0.2);
                background-color: white;
              }
           .welcomeImg {
            width: 30%;
        }
            .login_button {
            background-color: #E6570E;
            border-radius: 0px;
            width:100%;
            color: white;
            border-color: #E6570E;
            font-family: 'Poppins';
            font-size: 15px;
        }
        
        .login_button:hover {
            background-color: #E6570E;
            color: white;
            border-color: #E6570E;
        }
          </style>
        </head>
        
        <body>
         <div>
        
                        <center><div class="card"> <center>
                            <div style="font-size: 18px; margin-top: 30px; font-family: poppins;"><br><div class="mt-3">${name}</div></div>
                            <p class="welcomeFeddup-text">Api Report request is sent successfully</p></center><br />
                        </center>
                    </div >
        </body>
        
        </html>`;
            details.push({
            email : useremail,
            subject : _subject,
            body : body,
        });
        console.log("🚀 ~ file: mailHelper.js ~ line 45 ~ details", details)
  
        var mail = sendMail(details,  function(sendEmailResult){
            console.log("email sent succcessfully, response~",sendEmailResult);
            return sendEmailResult;
        });	
  
     },

     
     sendPdfTransactionToUser: function(userEmail,file,nameOfPerson){
      //  console.log(file);
  var details = [];
      var _subject =`Download your Transaction`;
      
      details.push({
          email : userEmail,
          subject :_subject,
          body :`<div style="width:325px;height:330px;margin:0 auto;padding:18px;border-radius:15px;background:#F6F5FF;">
          <div
            style="width:320px;height:320px;border-radius:15px;text-align: center;align-items:center;justify-content: center;background:white;">
            <img src="" style="width:40%;padding:20px" />
            <div style="color: #31197C;font-family:Open Sans; font-size:18px">Your Transaction are ready</div>
            <center>
            <p style="text-align: center;">Hi ${nameOfPerson}</p></center>   
            <p style="font-family:Open Sans;margin-top:10px;font-size:13px;font-weight:500;">Download the attachment</p>        
          </div>
        </div>`,
          attachments: [
              {
                  filename: `Transactions of ${nameOfPerson}.pdf`, 
                  content:file,                                        
                  contentType: 'application/pdf'
              }]
      });
      // console.log("🚀 ~ file: mailHelper.js ~ line 45 ~ details", details)

      var mail = sendMail(details,  function(sendEmailResult){
          console.log("email sent succcessfully, response~",sendEmailResult);
          return sendEmailResult;
      });		
   }

    }