module ExternalUrl exposing (about, airbeam, airbeamBuy, airbeamFaq, airbeamHowItWorks, airbeamUserStories, airbeamUsersGuide, aircasting, android, blog, donate, habitatMap, history, search)


habitatMap =
    "https://habitatmap.org"


android =
    "https://play.google.com/store/apps/details?id=pl.llp.aircasting&hl=en_US"



-- top level


airbeam =
    habitatMap ++ "/airbeam"


aircasting =
    habitatMap ++ "/aircasting"


blog =
    habitatMap ++ "/blog"


search =
    habitatMap ++ "/search"


donate =
    habitatMap ++ "/donate"


about =
    habitatMap ++ "/about"



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
