module ExternalUrl exposing (about, airbeam, airbeamBuy, airbeamFaq, airbeamHowItWorks, airbeamUserStories, airbeamUsersGuide, aircasting, android, blog, donate, habitatMap, history, press, search)


habitatMap =
    "https://habitatmap.org"


android =
    "https://play.google.com/store/apps/details?id=pl.llp.aircasting&hl=en_US"



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
