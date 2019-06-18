module Data.BoundedInteger exposing (BoundedInteger, LowerBound(..), UpperBound(..), Value(..), addOne, build, getLowerBound, getUpperBound, getValue, setValue, subOne)


type BoundedInteger
    = BoundedInteger
        { lowerBound : Int
        , upperBound : Int
        , value : Int
        }


type LowerBound
    = LowerBound Int


type UpperBound
    = UpperBound Int


type Value
    = Value Int


build : LowerBound -> UpperBound -> Value -> BoundedInteger
build (LowerBound lowerBound) (UpperBound upperBound) (Value value) =
    BoundedInteger
        { lowerBound = lowerBound
        , upperBound = upperBound
        , value = value
        }


setValue : Int -> BoundedInteger -> BoundedInteger
setValue value existingValue =
    updateValue (\_ -> value) existingValue


getValue : BoundedInteger -> Int
getValue (BoundedInteger existingValue) =
    existingValue.value


getUpperBound : BoundedInteger -> Int
getUpperBound (BoundedInteger existingValue) =
    existingValue.upperBound


getLowerBound : BoundedInteger -> Int
getLowerBound (BoundedInteger existingValue) =
    existingValue.lowerBound


updateValue : (Int -> Int) -> BoundedInteger -> BoundedInteger
updateValue update (BoundedInteger existingValue) =
    let
        updatedValue =
            update existingValue.value
    in
    if updatedValue > existingValue.upperBound then
        BoundedInteger existingValue

    else if updatedValue < existingValue.lowerBound then
        BoundedInteger existingValue

    else
        BoundedInteger { existingValue | value = updatedValue }


addOne : BoundedInteger -> BoundedInteger
addOne existingValue =
    updateValue (\x -> x + 1) existingValue


subOne : BoundedInteger -> BoundedInteger
subOne existingValue =
    updateValue (\x -> x - 1) existingValue
