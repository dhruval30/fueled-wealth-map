okay so we have the basic structure ready, the login is working, admins can send email invitations to people in their organisation, provide role based access, that's set up. 

to get these things to run,
in the backend, create a .env file:

PORT=
MONGO_URI=
JWT_SECRET=
NODE_ENV=development
FRONTEND_URL=http://localhost:5173
MJ_APIKEY_PUBLIC=
MJ_APIKEY_PRIVATE=
MJ_SENDER_EMAIL=

ima send this shi privately

run the backend using npm start
run the frontend using npm run dev

everything should work fine



if you wanna check there's this account i made on whihc things have been tested:
check@gmail.com
password is test@123



things to do tmr: 
1. let users update profiles based on their role, like admin can change company name, change access for employees, change passwords and so on

AND> Build the damn property map interface :(

Once that is done we need to add data viz and filtering, search, charts, graphs, just make it cool
