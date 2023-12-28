const express = require('express');
const cors = require('cors');
const jwt = require('jsonwebtoken');
const cookieParser = require('cookie-parser');
const app = express();
const { MongoClient, ServerApiVersion, ObjectId } = require('mongodb');
require('dotenv').config()
const port = process.env.PORT || 5000;

console.log(process.env.DB_PASS);

// middleware
app.use(cors({
  origin: ['http://localhost:5173', 'http://localhost:5174'],
  credentials: true
}));

app.use(express.json());
app.use(cookieParser());

const uri = `mongodb+srv://${process.env.DB_USER}:${process.env.DB_PASS}@cluster0.0zyo6s3.mongodb.net/?retryWrites=true&w=majority`;

// Create a MongoClient with a MongoClientOptions object to set the Stable API version
const client = new MongoClient(uri, {
  serverApi: {
    version: ServerApiVersion.v1,
    strict: true,
    deprecationErrors: true,
  }
});

async function run() {
  try {
    // Connect the client to the server	(optional starting in v4.7)
    

    const serviceCollection = client.db('mechanicDB').collection('services');
    const bookingCollection = client.db('mechanicDB').collection('bookings');

       // auth related api
       app.post('/jwt',  async (req, res) => {
        const user = req.body;
        console.log(user);
        const token = jwt.sign(user, process.env.ACCESS_TOKEN_SECRET, {
          expiresIn: '1h'
      });


            res
            .cookie('token', token, {
              httpOnly: true,
              secure: false
              
          })
            
            .send( { success: true } )
    })




// services related api

    app.get('/services', async (req, res) => {
        const cursor = serviceCollection.find();
        const result = await cursor.toArray();
        res.send(result);
    })

    app.get('/services/:id', async (req, res) => {
      const id = req.params.id;
      const query = { _id: new ObjectId(id) }

      const options = {
          // Include only the `title` and `imdb` fields in the returned document
          projection: { title: 1, price: 1, service_id: 1, img: 1 },
      };

      const result = await serviceCollection.findOne(query, options);
      res.send(result);
  })

   // bookings 

   app.get('/bookings', async (req, res) => {
    console.log(req.query.email);
    console.log('ttttt token', req.cookies.token)
    let query = {};
    if (req.query?.email) {
        query = { email: req.query.email }
    }
    const result = await bookingCollection.find(query).toArray();
    res.send(result);
})



   app.post('/bookings', async (req, res) => {
    const booking = req.body;
    console.log(booking);
    const result = await bookingCollection.insertOne(booking);
    res.send(result);
});

app.patch('/bookings/:id', async (req, res) => {
  const id = req.params.id;
  const filter = { _id: new ObjectId(id) };
  const updatedBooking = req.body;
  console.log(updatedBooking);
  const updateDoc = {
      $set: {
          status: updatedBooking.status
      },
  };
  const result = await bookingCollection.updateOne(filter, updateDoc);
  res.send(result);
})


app.delete('/bookings/:id', async (req, res) => {
  const id = req.params.id;
  const query = { _id: new ObjectId(id) }
  const result = await bookingCollection.deleteOne(query);
  res.send(result);
})

    // Send a ping to confirm a successful connection
   
    console.log("Pinged your deployment. You successfully connected to MongoDB!");
  } finally {
    // Ensures that the client will close when you finish/error
    // await client.close();
  }
}
run().catch(console.dir);



app.get('/', (req, res) => {
    res.send('mechanic is running')
})

app.listen(port, () => {
    console.log(`vehicle mechanic Server is running on port ${port}`)
})