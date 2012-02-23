describe "Region", ->
  beforeEach ->
    @region = new AirCasting.Models.Region()

  it "should properly set url params", ->
    @region.setUrlParams(
      north: 10
      south: 20
      east: 30
      west: 40
    )
    expect(@region.url()).toEqual("/api/regions?east=30&west=40&south=20&north=10")
