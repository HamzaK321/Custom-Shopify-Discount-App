
// import { TitleBar } from "@shopify/app-bridge-react";
import React, { useCallback, useState } from "react";
import { ButtonGroup, Button } from "@shopify/polaris";
import { useForm, useField } from "@shopify/react-form";
import { CurrencyCode } from "@shopify/react-i18n";
import metafields from "../metafields";

import {
  Page,
  Banner,
  AlphaCard,
  Card,
  LegacyCard,
  Layout,
  TextField,
  Stack,
  LegacyStack,
  PageActions,
  ChoiceList,
  Modal,
  List,
  Checkbox,
} from "@shopify/polaris";

// import { Card } from '@shopify/app-bridge-react';


import {
  ActiveDatesCard,
  CombinationCard,
  DiscountClass,
  DiscountMethod,
  MethodCard,
  DiscountStatus,
  RequirementType,
  SummaryCard,
  UsageLimitsCard,
  onBreadcrumbAction,
} from "@shopify/discount-app-components";
import { useAppBridge } from "@shopify/app-bridge-react";
import {useAuthenticatedFetch} from "../hooks"
// import { Item } from "@shopify/polaris/build/ts/latest/src/components/ActionList/components";
import { redirect } from "react-router-dom";
import { Redirect } from "@shopify/app-bridge/actions";
import { check } from "prettier";

const ProductList = ["Mobile", "Laptop", "watch"]

const Collections = ["electronics", "clothes", "games", "others"]

const todayDate = new Date();

const FUNCTION_ID = "145020944697"

export default function PageName() {
  const app = useAppBridge();
  const [isFirstButtonActive, setIsFirstButtonActive] = useState(true);
  const [isSecondButtonActive, setIsSecondButtonActive]= useState(true);
  const currentCode = CurrencyCode.Cad
  const [selected, setSelected] = useState(["COLLECTIONS"]);
  const [Product, setProduct] = useState([]);
  const [active, setActive] = useState(false);
  const [collections, setCollection] = useState(Collections);
  const [change, setChange] = useState(true);
  const [OnlyOne, setOnlyOne]= useState(false);
  const [selectedCollection, setSelectedCollection]= useState({
    CollectionsList: [],
    response: []
  })

  const handleChangeModel = useCallback(()=> setActive(!active), [active]);
  const activator = <Button onClick={handleChangeModel}>Browser</Button>


  const handleChange = (value) =>{
    if (value[0] == 'COLLECTIONS') {
      setSelected(value);
      setChange(true);
      setCollection(Collections);
    } else {
      setSelected(value);
      setChange(false);
      setProduct(Product)
    }
  }


  const handleSearch= (e) => {
    if (e.target.value === "") {
      setProduct(ProductList);
      return;
    } else {
      const FilterProductList = Product.filter(item => 
       item.toLowerCase().includes(e.target.value.toLowerCase()) 
        );
        setProduct(FilterProductList);
    }
  }

  const handleSearchSecond= (e) => {
    if (e.target.value === "") {
      setCollection(ProductList);
      return;
    } else {
      const FilterProductList = Collections.filter(item => 
       item.toLowerCase().includes(e.target.value.toLowerCase()) 
        );
        setCollection(FilterProductList);
    }
  }

  const handleChangeCheckbox = (e) => {
    const {value, checked} = e.target;
    const { CollectionsList } = selectedCollection;
    console.log(`${value} is ${checked}`);
    if (checked) {
      setChecked(checked);
      setSelectedCollection({
        CollectionsList: [...CollectionsList, value]
      })
    } else {
      setChecked(checked);
      setSelectedCollection({
        CollectionsList: [CollectionsList.filter(e => e !== value)]
      })
    }
  }

  const authenticatedFetch = useAuthenticatedFetch();

  const {
    fields: {
      discountTitle,
      discountCode,
      discountMethod,
      combinesWith,
      requirementType,
      requirementSubtotal,
      requirementQuantity,
      usageTotalLimit,
      usageOncePerCustomer,
      startDate,
      endDate,
      configuration,
      collection,
      products,
    },
    
    submit,
    submitting,
    dirty,
    reset,
    submitErrors,
    makeClean,

  } = useForm({
    fields: {
      discountTitle: useField(""),
      discountMethod: useField(DiscountMethod.Code),
      discountCode: useField(""),
      combinesWith: useField({
        orderDiscounts: false,
        productDiscounts: false,
        shippingDiscount: false,
      }),
      requirementType: useField(RequirementType.None),
      requirementSubtotal: useField("0"),
      requirementQuantity: useField("0"),
      usageTotalLimit: useField(null),
      usageOncePerCustomer: useField(false),
      startDate: useField(todayDate),
      endDate: useField(null),
      products: useField(),
      collection: useState(),
      configuration: {
        quantity: useField("1"),
        percentage: useField(""),
        value: useField(""),
      },

    },

    onSubmit: async form => {
      console.log(form,"Form Data");
      const discount = {
        functionId: FUNCTION_ID,
        combinesWith: form.combinesWith,
        startsAt: form.startDate,
        endsAt: form.endDate,
        metafields: [
          {
            namespace: metafields.namespace,
            key: metafields.key,
            type: "json",
            value: JSON.stringify({
              quantity: parseInt(form.configuration.quantity),
              percentage: parseFloat(form.configuration.percentage),
            })
          }
        ]
      };

      let response;
      if (form.discountMethod === DiscountMethod.Automatic) {
        response = await authenticatedFetch("/api/discounts/automatic", {
          method: "POST",
          headers: { "Content-Type ": "application/json"},
          body: JSON.stringify ({
            discount: {
              ...discount,
              title: form.discountTitle,
            }
          })
        })
      } else {
        response = await authenticatedFetch("/api/discounts/code", {
          method: "POST",
          headers: {"Content-Type": "application/json"},
          body: JSON.stringify({
            discount: {
              ...discount,
              title: form.discountCode,
              code:  form.discountCode
            }
          })
        })
      }

      const {
        error,
        data,
      } = await response.json();
      const remoteErrors = errors || data?.discountCreate?.userErrors;

      if (remoteErrors?.length > 0) {
        return {status: "fail", errors: remoteErrors};
      }

      redirect.dispatch(Redirect.Action.ADMIN_SECTION, {
        name: Redirect.ResourceType.Discount,
      });
      return {status: "success"}
    }

  });

  const handleFirstButtonClick = useCallback(()=>{
    if (isFirstButtonActive) return;
    setIsFirstButtonActive(true);
  }, [isFirstButtonActive]);

  const handleSecondButtonClick = useCallback(() => {
    // Do something here when the second button is clicked
    if (isSecondButtonActive) {
      return
    }
    setIsSecondButtonActive(true)
  }, [isSecondButtonActive]);

  const errorBanner = 
  submitErrors.length > 0 ? (
    <Layout.Section>
      <Banner status="critical">
        <p>There was some error with the form submission</p>
        <ul>
          {submitErrors.map(({message}, index)=>{
            return <li key={`${message}${index}`}>{message}</li>
          })}
        </ul>
      </Banner>
    </Layout.Section>
  ) :  null;



  return (
    <Page
    title="Create Discount Page"
    
    primaryAction= {{
      content: "Save",
      onAction: submit,
      disabled: !dirty,
      loading: submitting
    }}
    >
      <Layout>
      <Layout.Section>
        <form onSubmit={submit}>
          <MethodCard
          title="Volume"
          discountTitle={discountTitle}
          discountClass={DiscountClass.Product}
          discountCode={discountCode}
          discountMethod={discountMethod}
          />
          
          <LegacyCard title="Value" sectioned>

            <LegacyStack>
              <ButtonGroup segmented>
                <Button 
                pressed = {isFirstButtonActive}
                >
                  Percentage
                </Button>
                
                <Button 
                pressed = {!isFirstButtonActive}
                onClick={handleSecondButtonClick}
                >
                  FixedAmount
                </Button>

              </ButtonGroup>
              {isFirstButtonActive ? (
                <TextField 
                {...configuration.percentage}
                suffix="%"
                placeholder="0"/>
              ) : <TextField 
              {...configuration.value}
              prefix="$"
              placeholder="0.00"/>
            }


            </LegacyStack>

            <ChoiceList
             title= "APPLY TO"
             choices={[
              {label: "Specific collections", value: "COLLECTIONS"},
              {label: "Specific products", value: "PRODUCTS"}
             ]}
             selected={selected}
             onChange={handleChange}
            />

            <LegacyStack>
              {
                change?(
                  <TextField
                  {...configuration.value}
                  />
                ): (
                  <TextField
                  {...configuration.value}
                  />
                )
              }

              <div>
                {
                  change ? (
                    <Modal
                    activator={activator}
                    open={active}
                    onClose={handleChangeModel}
                    title= "Add collections"
                    primaryAction={{
                      content: "Add",
                      onAction: handleChangeModel
                    }}
                    secondaryActions={[
                      {
                        content: "Cancel",
                        onAction: handleChangeModel
                      }
                    ]}
                    >



                    
                

            <input
            type="text"
            onChange={handleSearchSecond}
            style={{
              width: "90%",
              padding: "1rem",
              marginLeft: "2rem"
            }}
            /> 

            <Modal.Section>
              <LegacyStack>
                <form>
                  <List>
                    {collection && 
                    collection.map((item, index)=>{
                      return(
                        <List.Item key={index}>
                          <input 
                          type="checkbox"
                          value={item}
                          checked={check}
                          onChange={handleChangeCheckbox}
                          />
                          <label>{item}</label>
                        </List.Item>
                      );
                    })
                    } 
                  </List>
                </form>
              </LegacyStack>
            </Modal.Section>
            </Modal>
              ) : (
                <Modal
                activator={activator}
                open={active}
                onClose={handleChangeModel}
                title= "Add Products"
                primaryAction={{
                  content: "Add",
                  onAction: handleChangeModel
                }}
                secondaryActions={[
                  {
                    content: "Cancel",
                    onAction: handleChangeModel
                  }
                ]}
                >

             <input
            type="text"
            onChange={handleSearch}
            style={{
              width: "90%",
              padding: "1rem",
              marginLeft: "2rem"
            }}/>


<Modal.Section>
              <LegacyStack>
                <form>
                  <List>
                    {Product && 
                    Product.map((item, index)=>{
                      return(
                        <List.Item key={index}>
                          <Checkbox
                          label= {item}
                          value={item}
                          name={item}
                          checked= {check}
                          />
                          <label>{item}</label>
                        </List.Item>
                      );
                    })
                    } 
                  </List>
                </form>
              </LegacyStack>
            </Modal.Section>
            </Modal>
                  )
                }
              </div>
            </LegacyStack>
          </LegacyCard>

          {discountMethod.value === DiscountMethod.Code && (
            <UsageLimitsCard
            totalUsageLimit={usageTotalLimit}
            oncePerCustomer={usageOncePerCustomer}
            />
          )}
          <CombinationCard
          combinableDiscountTypes={combinesWith}
          discountClass={DiscountClass.Product}
          discountDescriptor={
            discountMethod.value === DiscountMethod.Automatic
            ? discountTitle.value
            : discountCode.value
          }
          />
          <ActiveDatesCard
          startDate={startDate}
          endDate={endDate}
          timezoneAbbreviation="EST"
          />
        </form>
      </Layout.Section>
      <Layout.Section secondary>
        <SummaryCard
        header={{
          discountMethod: discountMethod.value,
          discountDescriptor: 
          discountMethod.value === DiscountMethod.Automatic
          ? discountTitle.value
          : discountCode.value,
          appDiscountType: "Volume",
          isEditing: false,
        }}
        performance={{
          status: DiscountStatus.Scheduled,
          usageCount:0,
        }}
        minimumRequirements={{
          requirementType: requirementType.value,
          subtotal: requirementSubtotal.value,
          quantity: requirementQuantity.value,
          currencyCode: currentCode,
        }}
        usageLimits={{
          oncePerCustomer: usageOncePerCustomer.value,
          totalUsageLimit: usageTotalLimit.value,
        }}
        activeDates={{
          startDate: startDate.value,
          endDate: endDate.value
        }}
        />

      </Layout.Section>
      <Layout.Section>
        <PageActions
        primaryAction={{
          content: "Save discount",
          onAction: submit,
          disabled: !dirty,
          loading: submitting,
        }}
        secondaryActions={[
          {
            content: "Discard",
            onAction: ()=> onBreadcrumbAction(redirect, true),
          },
        ]}
        />
      </Layout.Section>
      </Layout>
    </Page>
  );
}
