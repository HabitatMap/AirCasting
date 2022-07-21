module ExternalUrl exposing (about, airbeam, airbeamBuy, airbeamFaq, airbeamHowItWorks, airbeamUserStories, airbeamUsersGuide, aircasting, android, blog, donate, habitatMap, history, iOS, actions, press, search)


habitatMap =
    "https://habitatmap.org"


android =
    "https://play.google.com/store/apps/details?id=pl.llp.aircasting&hl=en_US"


iOS =
    "https://apps.apple.com/us/app/aircasting/id1587685281#?platform=iphone"

actions =
    "https://aircastingactions.org/"


-- top level


about =
    habitatMap ++ "/about"


airbeam =
    habitatMap ++ "/airbeam"


aircasting =
    habitatMap ++ "/aircasting"


blog =
    habitatMap ++ "/blog"


donate =
    habitatMap ++ "/donate"


press =
    habitatMap ++ "/about/press"


search =
    habitatMap ++ "/search"



-- airbeam


airbeamUserStories =
    airbeam ++ "/user-stories"


airbeamHowItWorks =
    airbeam ++ "/how-it-works"


airbeamFaq =
    airbeam ++ "/FAQ"


airbeamUsersGuide =
    airbeam ++ "/users-guide"


airbeamBuy =
    airbeam ++ "/buy-it-now"



-- about


history =
    about ++ "/history"
