// Domain barrel — importing this registers Typegoose models and exposes routes.
import "./models/courier-profile.model";
import "./models/delivery.model";
import "./models/message.model";
import "./models/rating.model";
import "./models/pricing-rule.model";
import "./models/notification.model";
import "./models/dispute.model";

export { default as deliveryRoutes } from "./delivery.routes";
export { seedDeliveryDemo } from "./delivery.seed";
