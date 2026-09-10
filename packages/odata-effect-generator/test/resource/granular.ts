/** Synthetic metadata with a small recursive closure and many unrelated roots. */
export const granularMetadata = (version: "V2" | "V4" = "V4"): string => `
<edmx:Edmx Version="${version === "V4" ? "4.0" : "1.0"}" xmlns:edmx="${
  version === "V4" ? "http://docs.oasis-open.org/odata/ns/edmx" : "http://schemas.microsoft.com/ado/2007/06/edmx"
}">
<edmx:DataServices><Schema Namespace="Fixture" xmlns="http://docs.oasis-open.org/odata/ns/edm">
<EnumType Name="Mood"><Member Name="Happy" Value="0"/><Member Name="Sad" Value="1"/></EnumType>
<ComplexType Name="Detail"><Property Name="Label" Type="Edm.String" Nullable="false"/>
<Property Name="Next" Type="Fixture.Detail"/><Property Name="Owner" Type="Fixture.Target"/></ComplexType>
<EntityType Name="Target"><Key><PropertyRef Name="ID"/></Key>
<Property Name="ID" Type="Edm.String" Nullable="false"/>
<Property Name="Details" Type="Collection(Fixture.Detail)" Nullable="false"/>
<Property Name="Mood" Type="Fixture.Mood" Nullable="false"/>
<NavigationProperty Name="Peers" Type="Collection(Fixture.Target)"/>
</EntityType>
${
  Array.from({ length: 24 }, (_, i) =>
    `<EntityType Name="Unrelated${i}"><Key><PropertyRef Name="ID"/></Key>
<Property Name="ID" Type="Edm.String" Nullable="false"/><Property Name="UnrelatedMarker${i}" Type="Edm.String"/></EntityType>`)
    .join("\n")
}
<Function Name="Find"><Parameter Name="Search" Type="Edm.String" Nullable="false"/>
<ReturnType Type="Collection(Fixture.Target)"/></Function>
<Function Name="FindMood"><ReturnType Type="Fixture.Mood"/></Function>
<Function Name="Other"><ReturnType Type="Fixture.Unrelated0"/></Function>
<Action Name="Save"><Parameter Name="Input" Type="Fixture.Target" Nullable="false"/><ReturnType Type="Fixture.Target"/></Action>
<EntityContainer Name="FixtureService"><EntitySet Name="Targets" EntityType="Fixture.Target"/>
${
  Array.from({ length: 24 }, (_, i) => `<EntitySet Name="Unrelated${i}Set" EntityType="Fixture.Unrelated${i}"/>`).join(
    "\n"
  )
}
<Singleton Name="Current" Type="Fixture.Target"/>
</EntityContainer></Schema></edmx:DataServices></edmx:Edmx>`
