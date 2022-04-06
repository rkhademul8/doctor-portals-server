const express = require('express')
const app = express()
const cors=require('cors')
require('dotenv').config()
const { MongoClient, ServerApiVersion } = require('mongodb');
const res = require('express/lib/response');
const port =process.env.PORT || 5000

// doctors-portal-firebase-adminsdk.json

//  JWT 
// const admin = require("firebase-admin");

// const serviceAccount = require('./doctors-portal-firebase-adminsdk.json');

// admin.initializeApp({
//   credential: admin.credential.cert(serviceAccount)
// });




// middleware
app.use(cors())
app.use(express.json())
const uri = `mongodb+srv://${process.env.DB_USER}:${process.env.DB_PASS}@cluster0.pptx3.mongodb.net/myFirstDatabase?retryWrites=true&w=majority`;


const client = new MongoClient(uri, { useNewUrlParser: true, useUnifiedTopology: true, serverApi: ServerApiVersion.v1 });


async function verifyToken(req,res,next){
  if(req.headers?.authorization?.startsWith('Bearer ')){
    const token=req.headers.authorization.split(' ')[1]
  
  try{
    const decodedUser=await admin.auth().verifyIdToken(token)
    req.decodedEmail=decodedUser.email
  }

  catch{}
  
  }
  next()
}


  async function run() {
    try {
      await client.connect();
      const database = client.db("doctors_portal");
      const appoinmentsCollection = database.collection("appoinments");
      const userCollection=database.collection('users')

      // 
      app.get('/appoinments',verifyToken, async(req,res)=>{
        const email=req.query.email
        const date=new Date(req.query.date).toLocaleDateString()
        // console.log(date);
        const query={email:email, date:date}
        const cursor=appoinmentsCollection.find(query)
        const appoinments=await cursor.toArray()
        res.json(appoinments)
      })



      // Appoinment booking insert
      app.post('/appoinments',async(req,res)=>{
        const appoinment=req.body
        // console.log(appoinment);
        const result=await appoinmentsCollection.insertOne(appoinment)
        res.json(result)
      })

      // admin check
      app.get('/users/:email',async(req,res)=>{
        const email=req.params.email
        const querry={email:email}
        const user=await userCollection.findOne(querry)
        let isAdmin=false
        if(user?.role === 'Admin'){
          isAdmin=true
        }
        res.json({admin:isAdmin})

      })

      // users save to database
      app.post('/users',async(req,res)=>{
        const user=req.body
        const result=await userCollection.insertOne(user)
        console.log(result);
        res.json(result)
      })

      // handle google singnin if already user exit then skip otherwise it add user
      app.put('/users',async(req,res)=>{
        const user=req.body
        const filter={email:user.email}
        const options={upsert:true}
        const updateDoc={$set:user}

        const result=await userCollection.updateOne(filter,updateDoc,options)
      res.json(result)
      
      })


      //  make admin to user
      app.put('/users/admin',verifyToken,async(req,res)=>{
        const user=req.body

        // console.log("object",req.decodedEmail);

       const requester= req.decodedEmail

        if(requester){
          const requesterAccount=await userCollection.findOne({email:requester})
          
          if(requesterAccount.role === 'Admin'){

            const filter= {email:user.email}
            const updateDoc={$set:{role:'Admin'}}
            const result=await userCollection.updateOne(filter,updateDoc)
            res.json(result)
          }
       
        }
        else{
          res.status(401).json({message:'you do not have access to make admin'})
        }

        
        
      })

    
    } finally {
      // await client.close();
    }
  }
  run().catch(console.dir);




app.get('/', (req, res) => {
  res.send('Hello Doctor portal!')
})

app.listen(port, () => {
  console.log(`Example app listening on port ${port}`)
})

// app.get('/user')
// app.get('/user/:id')
// app.post('/user')
// app.put('/user/:id')
// app.delete('/user/:id')



