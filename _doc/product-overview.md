Build a package delivery platform MVP called "Pakettt!". It connects customers who want to send packages with delivery drivers/couriers. The system should have three roles: Customer, Courier, and Admin.

Customers can register and log in, create delivery requests, enter pickup and delivery addresses, specify package details (size, weight, category, special instructions), view estimated delivery costs, track delivery status in real time, communicate with the assigned courier, view delivery history, and rate completed deliveries.

Couriers can register and log in, complete profile and vehicle verification, toggle online/offline availability, receive delivery requests, accept or reject jobs, navigate to pickup and drop-off locations, update delivery status throughout the journey, upload proof of pickup and proof of delivery (photos and signatures), communicate with customers, and view earnings and delivery history.

Admins can manage customers and couriers, verify courier accounts, monitor active deliveries, manage delivery pricing rules, review disputes, access operational analytics, and oversee the entire delivery network.

Core delivery workflow:
1. Customer creates a delivery request.
2. Nearby available couriers receive the request.
3. A courier accepts the job.
4. Courier travels to pickup location.
5. Courier confirms package pickup with photo proof.
6. Customer can track courier location in real time.
7. Courier delivers the package.
8. Recipient signs or confirms receipt.
9. Courier uploads proof of delivery.
10. Delivery is marked as completed and both parties can leave ratings.

Key Features:
- User authentication and role-based access control
- Real-time GPS tracking
- Interactive maps
- Delivery request management
- Package information management
- Delivery status tracking
- Push notifications
- In-app chat between customer and courier
- Photo proof of pickup and delivery
- Electronic signature capture
- Delivery history
- Ratings and reviews
- Responsive mobile-first design

Delivery Statuses:
- Pending
- Searching for Courier
- Courier Assigned
- Courier En Route to Pickup
- Package Picked Up
- In Transit
- Arriving Soon
- Delivered
- Cancelled

UI/UX:
- Clean and modern logistics-focused design
- Fast booking process with minimal steps
- Clear package tracking timeline
- Live map tracking screen
- Mobile-friendly experience for both customers and couriers

Technical Requirements:
- Complete frontend and backend
- Database schema and APIs
- Real-time location updates
- Cloud file storage for proof photos
- Secure authentication
- Scalable architecture
- Demo/seed data

Focus on delivering a production-ready MVP that solves the core package delivery workflow before adding advanced features such as digital wallets, multi-stop deliveries, business accounts, subscriptions, or international shipping.