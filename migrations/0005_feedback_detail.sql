-- 0005_feedback_detail.sql
-- Added 2026-09-16. Splits private feedback into the three things Peter can actually
-- act on separately, plus the two context fields that explain a complaint.
--
-- WHY: Peter's standing complaint is that Uber/DoorDash drivers batch four orders at
-- once, the food arrives late, and HE wears the review even though the kitchen was on
-- time. With one blended "how was it" box there is nowhere for that to land except his
-- public rating. Splitting delivery out gives it a home.
--
-- WHY WAIT TIME: his first bad review was a perception problem. A heavily loaded XL
-- pizza genuinely took ~25 minutes while a pre-ordered table was served on arrival, and
-- the customer remembered it as "70 minutes" and queue-jumping. A wait-time field
-- catches that gap between felt and actual.
--
-- WHY VISIT REASON: Steve's idea. It is a low-commitment opening question, it segments
-- the feedback, and naming the other occasions (wing night, game day, pool, family
-- night) plants a reason to come back for something different.
--
-- NOTE: functions/api/feedback.js names its INSERT columns explicitly and its catch
-- block swallows errors, so a column added here but NOT added to the INSERT bind list
-- fails SILENTLY. Change both together.

-- Values match the overall-sentiment row on the form, deliberately: Steve asked for one
-- consistent option set so a reader is not translating "Off" against "Meh/Bad" (2026-09-16).
ALTER TABLE leads ADD COLUMN rating_food TEXT;      -- great | ok | meh | bad
ALTER TABLE leads ADD COLUMN rating_service TEXT;   -- great | ok | meh | bad
ALTER TABLE leads ADD COLUMN rating_delivery TEXT;  -- great | ok | meh | bad | na  (na = did not order delivery)
ALTER TABLE leads ADD COLUMN wait_time TEXT;        -- free text, e.g. "about 20 min"
ALTER TABLE leads ADD COLUMN visit_reason TEXT;     -- friends | date | game | pool | vlts | family | team | other
ALTER TABLE leads ADD COLUMN went_well TEXT;        -- asked BEFORE the improvement question, deliberately

CREATE INDEX IF NOT EXISTS idx_leads_delivery ON leads(rating_delivery) WHERE rating_delivery IS NOT NULL;
